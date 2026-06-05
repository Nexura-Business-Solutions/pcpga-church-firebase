import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import PhilippinesMap from '../components/PhilippinesMap.jsx';
import AnnouncementModal from '../components/AnnouncementModal.jsx';
import EventsCarousel from '../components/EventsCarousel.jsx';
import WelcomeCarousel from '../components/WelcomeCarousel.jsx';
import MobileScrollAids from '../components/MobileScrollAids.jsx';
import { getSettings, getSermons } from '../lib/store.js';
import { defaultPresbyteries, defaultWelcomeOfficers } from '../lib/seed-data.js';
import '../styles/landing-v3.css';

const REGION_ORDER = ['Luzon', 'NCR', 'Visayas', 'Mindanao', 'CAR'];
const REGION_LABEL = {
  Luzon: { title: 'Luzon', emTitle: '& Cordillera' },
  NCR: { title: 'Metro', emTitle: 'Manila' },
  Visayas: { title: 'Visayas', emTitle: '& the Islands' },
  Mindanao: { title: 'Mindanao', emTitle: '& the South' },
  CAR: { title: 'Cordillera', emTitle: 'Administrative Region' },
};
const REGION_ROMAN = ['I.', 'II.', 'III.', 'IV.', 'V.'];

function toLowerRoman(num) {
  const map = [['xc', 90], ['l', 50], ['xl', 40], ['x', 10], ['ix', 9], ['v', 5], ['iv', 4], ['i', 1]];
  let n = num;
  let out = '';
  for (const [letter, value] of map) {
    while (n >= value) { out += letter; n -= value; }
  }
  return out + '.';
}

function congregationCount(p) {
  if (typeof p.congregations === 'number') return p.congregations;
  if (Array.isArray(p.churches)) return p.churches.length;
  return 0;
}

const COMMITTEES = [
  {
    name: 'Executive Committee',
    sub: 'Acts for the General Assembly between sessions.',
    description: 'Coordinates general execution of matters entrusted by the body, prepares GA meetings, and represents the denomination before sister bodies.',
    duties: [
      'To execute all matters entrusted by the General Assembly body.',
      'To prepare all matters for the next General Assembly meeting.',
      'To represent the denomination in ecumenical relations.',
    ],
    officers: [
      { name: 'Rev. Edgar P. Adra', role: 'Moderator' },
      { name: 'Rev. Orlando M. Tabotabo', role: 'Vice-Moderator' },
      { name: 'Rev. Nelson M. Dangan', role: 'General Secretary' },
      { name: 'Rev. Victorino G. Dagaman', role: 'Treasurer' },
      { name: 'Rev. Roberto G. Fabia', role: 'Recording Clerk' },
      { name: 'Rev. Arturo Dumayag', role: 'Internal Auditor' },
    ],
  },
  {
    name: 'Mission Committee',
    sub: 'Home and foreign mission of the church.',
    description: 'Leads programs for home and foreign missions, monitors ongoing mission works, raises funds for mission, and recruits & deploys missionaries.',
    duties: [
      'To make programs for home and foreign mission.',
      'To monitor ongoing mission works in the field.',
      'To raise funds for mission and missionary support.',
    ],
    officers: [],
  },
  {
    name: 'Theological Education',
    sub: 'Training the next generation of pastors.',
    description: 'Sets standards for theological training institutions, recommends curricula, and manages scholarship programs for ministerial candidates.',
    duties: [
      'To set standards for theological institutions.',
      'To recommend curriculum for ministerial training.',
      'To set up and administer scholarship programs.',
    ],
  },
  {
    name: 'Christian Education',
    sub: 'Curricula for Sunday Schools and discipleship.',
    description: 'Develops curricula for Sunday Schools, formulates policies for CE, and organizes educational seminars across congregations.',
    duties: [
      'To formulate policies for Christian Education.',
      'To develop curriculum for Sunday School.',
      'To organize seminars and workshops.',
    ],
  },
  {
    name: 'Diaconal & Welfare',
    sub: 'Disaster relief, widows, and orphans.',
    description: 'Manages disaster relief, raises funds for welfare projects, and supports the families of deceased ministers.',
    duties: [
      'To formulate policies for relief operations.',
      'To raise funds for relief works.',
      'To help the families of deceased Ministers.',
    ],
  },
  {
    name: 'Church Auxiliaries',
    sub: 'Youth, men’s, and women’s fellowships.',
    description: 'Coordinates fellowships for Youth, Men, and Women organizations, and manages national church camps.',
    duties: [
      'To supervise Youth, Men, and Women’s organizations.',
      'To co-ordinate national church camps and conferences.',
    ],
  },
  {
    name: 'Publication Committee',
    sub: 'Books, minutes, and the website.',
    description: 'Oversees official Assembly publications, manages GA materials, and maintains the church website.',
    duties: [
      'To oversee and publish General Assembly materials.',
      'To manage and maintain the official website.',
    ],
  },
  {
    name: 'Finance Committee',
    sub: 'Budgets and the stewardship of giving.',
    description: 'Formulates annual budgets, monitors church income and expenditures, and recommends financial policies for the assembly’s approval.',
    duties: [
      'To formulate the annual denominational budget.',
      'To monitor income and expenditures.',
      'To recommend financial policies.',
    ],
  },
  {
    name: 'Judicial Court',
    sub: 'Appellate jurisdiction over the church.',
    description: 'Handles all judicial matters and appeals within the denomination and reports its proceedings to the General Assembly.',
    duties: [
      'To handle all judicial matters arising in the church.',
      'To prepare a report to the next General Assembly meeting.',
    ],
  },
];

// Derive the "at a glance" numbers from the real canon directory so they can
// never drift back into placeholder territory (was 128yrs/1898, 144, 42K).
const TOTAL_CONGREGATIONS = defaultPresbyteries.reduce((n, p) => n + congregationCount(p), 0);
const POPULATED_REGIONS = new Set(
  defaultPresbyteries.filter((p) => congregationCount(p) > 0).map((p) => p.region),
).size;

const STATS = [
  { roman: 'I.', target: 39, label: 'Years of Ministry', note: 'since 1987' },
  { roman: 'II.', target: TOTAL_CONGREGATIONS, label: 'Congregations', note: 'across the archipelago' },
  { roman: 'III.', target: defaultPresbyteries.length, label: 'Presbyteries', note: 'regional governing bodies' },
  { roman: 'IV.', target: POPULATED_REGIONS, label: 'Regions', note: 'Luzon to Mindanao' },
];

// Preset giving amounts (PHP) shown on the homepage card; mirror Donation.jsx PRESETS.
const GIVE_AMOUNTS = [500, 1000, 2500, 5000];

const NAV_LINKS = [
  { href: '#message', label: 'About', roman: 'i.' },
  { href: '#sermons', label: 'Sermons', roman: 'ii.' },
  { href: '/history', label: 'History', roman: 'iii.' },
  { href: '/churches', label: 'Churches', roman: 'iv.' },
  { href: '/library', label: 'Library', roman: 'v.' },
  { href: '#donate', label: 'Give', roman: 'vi.' },
];

// Turn a YouTube watch / youtu.be / embed URL into an embeddable URL so sermons
// play inside the site rather than redirecting away.
function toEmbedUrl(url) {
  if (!url) return null;
  const m = String(url).match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{6,})/);
  return m ? `https://www.youtube.com/embed/${m[1]}` : null;
}

function Divider({ width = 180 }) {
  return (
    <div className="divider" aria-hidden="true">
      <svg width={width} height="20" viewBox="0 0 180 20" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M0 10 L60 10 M75 10 Q80 5 85 10 Q90 15 95 10 L120 10" />
        <circle cx="70" cy="10" r="1.5" fill="currentColor" />
      </svg>
      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
        <path d="M7 0l1.6 5.4L14 7l-5.4 1.6L7 14l-1.6-5.4L0 7l5.4-1.6L7 0z" />
      </svg>
      <svg width={width} height="20" viewBox="0 0 180 20" fill="none" stroke="currentColor" strokeWidth="1">
        <path d="M180 10 L120 10 M105 10 Q100 5 95 10 Q90 15 85 10 L60 10" />
        <circle cx="110" cy="10" r="1.5" fill="currentColor" />
      </svg>
    </div>
  );
}

function StatItem({ stat, refSetter }) {
  return (
    <div className="stats__item reveal">
      <div className="stats__roman">{stat.roman}</div>
      <div className="stats__value">
        <span ref={refSetter} data-count="" data-target={stat.target}>{stat.target}</span>
        {stat.suffix && <em>{stat.suffix}</em>}
      </div>
      <div className="stats__label">{stat.label}</div>
      <div className="stats__note">{stat.note}</div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [lang, setLang] = useState('en');
  const [modal, setModal] = useState(null);
  const [activeAmount, setActiveAmount] = useState(1);
  const [donorName, setDonorName] = useState('');
  const [activeSermon, setActiveSermon] = useState(0);
  const [playing, setPlaying] = useState(false);
  // Mobile-only progressive disclosure for the two longest lists.
  const [showAllPres, setShowAllPres] = useState(false);
  const [showAllCommittees, setShowAllCommittees] = useState(false);
  const scrollFillRef = useRef(null);
  const countRefs = useRef([]);

  // CMS content — loaded from Firestore settings; every field falls back to the
  // hardcoded copy below so the page is identical until something is edited.
  const [cms, setCms] = useState({});
  useEffect(() => {
    let active = true;
    (async () => {
      const keys = ['hero', 'site-identity', 'mission-vision', 'core-principles', 'invitation-stats', 'announcement', 'standing-committees', 'presbyteries', 'upcoming-events', 'welcome-officers'];
      const [hero, identity, mv, msg, stats, ann, committees, pres, events, welcomeOfficers, sermons] = await Promise.all([
        ...keys.map((k) => getSettings(k)), getSermons(),
      ]);
      if (active) setCms({
        hero: hero || {}, identity: identity || {}, mv: mv || {}, msg: msg || {},
        stats: stats || {}, ann: ann || {}, committees: Array.isArray(committees) ? committees : [],
        presbyteries: Array.isArray(pres) ? pres : [],
        events: Array.isArray(events) ? events : [],
        welcomeOfficers: Array.isArray(welcomeOfficers) ? welcomeOfficers : [],
        sermons: Array.isArray(sermons) ? sermons : [],
      });
    })();
    return () => { active = false; };
  }, []);
  const hero = cms.hero || {};
  // Upcoming events — rotating posters from settings/upcoming-events (seeded via admin).
  const upcomingEvents = Array.isArray(cms.events) ? cms.events : [];
  // Normalize committees (editor stores `details`; landing modal reads `duties`).
  const committees = (cms.committees?.length ? cms.committees : COMMITTEES).map((c) => ({
    name: c.name,
    sub: c.sub || '',
    description: c.description || '',
    duties: c.duties || c.details || [],
    officers: c.officers || [],
  }));
  // Real sermons from the Sermon Archive (falls back to sample copy when empty).
  const sermons = cms.sermons || [];
  const featured = sermons[activeSermon] || sermons[0] || null;
  const featuredEmbed = toEmbedUrl(featured?.videoUrl);
  // Presbyteries: editable copy from settings; fall back to the seeded defaults
  // (defaultPresbyteries) so the page works even before any admin edits.
  const presbyteries = (cms.presbyteries && cms.presbyteries.length > 0)
    ? cms.presbyteries : defaultPresbyteries;
  // "A Word of Welcome" carousel — editable officers from settings, else seeded drafts.
  const welcomeOfficers = (cms.welcomeOfficers && cms.welcomeOfficers.length > 0)
    ? cms.welcomeOfficers : defaultWelcomeOfficers;

  // Group by `region` (data-driven) so the section scales as more presbyteries
  // are added without touching the layout code.
  const presbyteriesByRegion = (() => {
    const groups = {};
    presbyteries.forEach((p, idx) => {
      const region = p.region || 'Other';
      (groups[region] = groups[region] || []).push({ ...p, _idx: idx });
    });
    const orderedRegions = Object.keys(groups).sort((a, b) => {
      const ai = REGION_ORDER.indexOf(a);
      const bi = REGION_ORDER.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
    let running = 0;
    return orderedRegions.map((region, ri) => {
      const items = groups[region].map((item) => {
        running += 1;
        return { ...item, _roman: toLowerRoman(running) };
      });
      const label = REGION_LABEL[region] || { title: region, emTitle: '' };
      return {
        region,
        num: REGION_ROMAN[ri] || `${ri + 1}.`,
        title: label.title,
        emTitle: label.emTitle,
        count: `${items.length} ${items.length === 1 ? 'Presbytery' : 'Presbyteries'}`,
        items,
      };
    });
  })();

  // body class management
  useEffect(() => {
    document.body.classList.add('lp-v3');
    return () => {
      document.body.classList.remove('lp-v3', 'mobile-open', 'modal-open', 'lang-tl', 'nav-compact');
    };
  }, []);

  useEffect(() => {
    document.body.classList.toggle('mobile-open', mobileOpen);
  }, [mobileOpen]);

  useEffect(() => {
    document.body.classList.toggle('modal-open', modal !== null);
  }, [modal]);

  useEffect(() => {
    document.body.classList.toggle('lang-tl', lang === 'tl');
  }, [lang]);

  // Reveal-on-scroll
  useEffect(() => {
    const els = document.querySelectorAll('.reveal');
    if (!('IntersectionObserver' in window)) {
      els.forEach((e) => e.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const idx = entry.target.parentElement
            ? Array.prototype.indexOf.call(entry.target.parentElement.children, entry.target)
            : 0;
          entry.target.style.transitionDelay = Math.min(idx * 70, 420) + 'ms';
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  // Scroll progress bar
  useEffect(() => {
    const fill = scrollFillRef.current;
    if (!fill) return undefined;
    let ticking = false;
    function update() {
      const h = document.documentElement;
      const max = h.scrollHeight - h.clientHeight;
      const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
      fill.style.width = pct + '%';
      // Compact the nav once scrolled past the masthead (mobile smoothing).
      document.body.classList.toggle('nav-compact', window.scrollY > 60);
      ticking = false;
    }
    function onScroll() {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    update();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Count-up
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const nodes = countRefs.current.filter(Boolean);
    if (!nodes.length) return undefined;
    if (reduced) {
      nodes.forEach((n) => { n.textContent = n.getAttribute('data-target'); });
      return undefined;
    }
    function countUp(el) {
      const target = parseFloat(el.getAttribute('data-target')) || 0;
      const duration = 1700;
      const start = performance.now();
      function frame(now) {
        const t = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - t, 3);
        el.textContent = Math.round(target * eased);
        if (t < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          countUp(e.target);
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.5 });
    nodes.forEach((n) => io.observe(n));
    return () => io.disconnect();
  }, []);

  // Parallax
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduced) return undefined;
    const els = Array.from(document.querySelectorAll('[data-parallax]'));
    if (!els.length) return undefined;
    let vh = window.innerHeight;
    let ticking = false;
    function onResize() { vh = window.innerHeight; }
    function update() {
      els.forEach((el) => {
        const parent = el.parentElement;
        const rect = parent.getBoundingClientRect();
        if (rect.bottom < -200 || rect.top > vh + 200) return;
        const speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
        const centerOffset = rect.top + rect.height / 2 - vh / 2;
        let translate = centerOffset * -speed;
        if (translate > 120) translate = 120;
        if (translate < -120) translate = -120;
        el.style.transform = `translate3d(0,${translate.toFixed(1)}px,0)`;
      });
      ticking = false;
    }
    function onScroll() {
      if (!ticking) { requestAnimationFrame(update); ticking = true; }
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  // Sequential map pin reveal
  useEffect(() => {
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const map = document.querySelector('.ph-map');
    if (!map) return undefined;
    const pins = map.querySelectorAll('.map-pin');
    if (!pins.length) return undefined;
    if (reduced) {
      pins.forEach((p) => p.classList.add('is-in'));
      return undefined;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) {
          pins.forEach((p, i) => {
            setTimeout(() => p.classList.add('is-in'), 240 + i * 240);
          });
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.35 });
    io.observe(map);
    return () => io.disconnect();
  }, []);

  // Nav active state
  useEffect(() => {
    const links = document.querySelectorAll('.nav__link[href^="#"]');
    const map = {};
    links.forEach((a) => {
      const href = a.getAttribute('href');
      if (href && href.charAt(0) === '#') map[href.slice(1)] = a;
    });
    const sections = Object.keys(map).map((id) => document.getElementById(id)).filter(Boolean);
    if (!sections.length) return undefined;
    function onScroll() {
      const pos = window.scrollY + 140;
      let active = sections[0];
      sections.forEach((s) => { if (s.offsetTop <= pos) active = s; });
      Object.values(map).forEach((a) => a.classList.remove('is-active'));
      if (map[active.id]) map[active.id].classList.add('is-active');
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // ESC closes mobile menu + modal
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') {
        setMobileOpen(false);
        setModal(null);
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function openCommittee(i) { setModal({ kind: 'committee', i }); }
  function openPresbytery(i) { setModal({ kind: 'presbytery', i }); }
  function closeModal() { setModal(null); }

  return (
    <>
      <Helmet>
        <title>Presbyterian Church of the Philippines · Sacred Heritage</title>
        <meta name="description" content="A communion of Reformed congregations gathered around Scripture, Sacrament, and the historic Presbyterian faith — keeping the old paths across the islands since 1987." />
      </Helmet>

      <div className="scroll-bar" aria-hidden="true">
        <div className="scroll-bar__fill" ref={scrollFillRef} />
      </div>

      {/* MASTHEAD */}
      <div className="masthead">
        <div className="masthead__inner">
          <span className="masthead__latin">Verbum Domini manet in aeternum</span>
          <div className="masthead__meta">
            <span>Vol. XXXIX · No. 12</span>
            <span>Manila · A.D. MMXXVI</span>
            <span>Lord’s Day xliii</span>
            <span className="lang-toggle">
              <button className={lang === 'en' ? 'is-active' : ''} onClick={() => setLang('en')} type="button">EN</button>
              <span className="sep">·</span>
              <button className={lang === 'tl' ? 'is-active' : ''} onClick={() => setLang('tl')} type="button">TL</button>
            </span>
          </div>
        </div>
      </div>

      {/* NAV */}
      <header className="nav">
        <div className="nav__inner">
          <Link to="/" className="nav__brand">
            <img src="/pcpga_logo.png" alt="" className="nav__logo" />
            <div className="nav__brand-text">
              <span className="nav__name">{cms.identity?.name || 'Presbyterian Church'}</span>
              <span className="nav__sub">{cms.identity?.sub || 'of the Philippines'}</span>
            </div>
          </Link>
          <nav className="nav__links">
            {NAV_LINKS.map((l) => (
              <a key={l.href} href={l.href} className="nav__link">{l.label}</a>
            ))}
            <div className="nav__actions">
              <Link to="/churches" className="btn btn--primary btn--small">Find a Church</Link>
            </div>
          </nav>
          <button
            className="nav__burger"
            aria-label="Toggle menu"
            type="button"
            onClick={() => setMobileOpen((v) => !v)}
          >
            <span /><span /><span />
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      <div className="mobile-menu" aria-hidden={!mobileOpen}>
        {NAV_LINKS.map((l) => (
          <a
            key={l.href}
            href={l.href}
            className="mobile-menu__link"
            onClick={() => setMobileOpen(false)}
          >
            {l.label} <em>{l.roman}</em>
          </a>
        ))}
        <span className="mobile-menu__divider" />
        <Link to="/churches" className="btn btn--primary" onClick={() => setMobileOpen(false)}>
          Find a Church
        </Link>
      </div>

      {/* HERO */}
      <section className="hero" id="hero" aria-label="Welcome">
        <div className="hero__bg" data-parallax="0.15">
          <img src="/pcp-hero.jpg" alt="" />
        </div>

        <div className="hero__inner">
          <div className="hero__copy reveal">
            <div className="hero__edition">
              <span className="brass">✦</span>
              <span>{hero.editionText || 'A Communion of Reformed Churches'}</span>
              <span className="sep">·</span>
              <span>Est. MCMLXXXVII</span>
              <span className="sep">·</span>
              <span className="brass">39 Years in the Islands</span>
            </div>

            <h1 className="hero__title">
              <span data-en="">{hero.heading || <>Welcome <em>home.</em></>}</span>
              <span data-tl="">{hero.headingTl || <>Maligayang <em>pagdating.</em></>}</span>
            </h1>

            <p className="hero__lede">
              {hero.lede || 'A communion of Reformed congregations gathered around Scripture, Sacrament, and the historic Presbyterian faith — keeping the old paths across the islands since 1987.'}
            </p>

            <div className="hero__actions">
              <Link to="/churches" className="btn btn--primary">{hero.ctaPrimary || 'Find a Church'}</Link>
              <a href="#sermons" className="btn btn--ghost-light">{hero.ctaSecondary || 'Watch the Sermon'}</a>
            </div>

            <p className="hero__times">{hero.times || 'Sunday Worship · 9:00 & 11:00 AM · Metro Manila'}</p>
          </div>

          <div className="wax-seal reveal reveal--scale" aria-hidden="true">
            <div className="wax-seal__inner">
              <span className="wax-seal__diamond">✦</span>
              <span>General<br />Assembly</span>
              <span className="wax-seal__year">MCMLXXXVII</span>
            </div>
          </div>
        </div>

        <div className="hero__scroll" aria-hidden="true">
          <span>Scroll</span>
          <span className="hero__scroll-line" />
        </div>
      </section>

      {/* STATS */}
      <section className="stats" aria-label="At a glance">
        <div className="stats__grid">
          {(() => {
            const ROMANS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.'];
            const list = cms.stats?.stats?.length
              ? cms.stats.stats.map((s, i) => {
                  const m = String(s.value ?? '').match(/^(\d+)(.*)$/);
                  return {
                    roman: ROMANS[i] || `${i + 1}.`,
                    target: m ? Number(m[1]) : (Number(s.value) || 0),
                    suffix: m ? m[2].trim() : '',
                    label: s.label,
                    note: s.note || STATS[i]?.note || '',
                  };
                })
              : STATS;
            return list.map((s, i) => (
              <StatItem
                key={s.label || i}
                stat={s}
                refSetter={(el) => { countRefs.current[i] = el; }}
              />
            ));
          })()}
        </div>
      </section>

      {/* EVENTS */}
      <section className="events" id="events" aria-label="Upcoming events">
        <div className="events__inner">
          <div className="events__head">
            <h3 className="events__title">Upcoming &amp; <em>in session.</em></h3>
            <span className="events__feed">
              <span className="live-dot" aria-hidden="true" />
              <span>Denominational Feed</span>
            </span>
          </div>
          {upcomingEvents.length > 0 ? (
            <EventsCarousel events={upcomingEvents} />
          ) : (
            <div className="events__empty reveal">
              <p>Upcoming events &amp; dispatches will be posted here as the General Assembly and the presbyteries convene.</p>
            </div>
          )}
        </div>
      </section>

      <Divider />

      {/* MODERATOR'S LETTER */}
      <section className="editorial" id="message" aria-label="A word of welcome">
        <div className="editorial__grid">
          <aside className="editorial__meta reveal">
            <span className="kicker">A Word of Welcome</span>
            <span className="bylabel">From the General Assembly</span>
          </aside>
          <div className="editorial__body reveal">
            <WelcomeCarousel officers={welcomeOfficers} />
          </div>
          <aside className="marginalia reveal">
            <div className="margin-note">
              <span className="label">Note</span>
              The first General Presbytery of the PCP convened at Bagong Bayan Presbyterian Church, Dasmariñas, Cavite, on 26 June 1987.
            </div>
            <div className="margin-note">
              <span className="label">Cf.</span>
              “Stand ye in the ways, and see, and ask for the old paths, where is the good way, and walk therein…”
              <span className="scripture">Jeremiah 6 : 16</span>
            </div>
            <div className="margin-note">
              <span className="label">In Session</span>
              The General Assembly convenes annually on the third Tuesday of October, by appointment of the previous stated meeting.
            </div>
          </aside>
        </div>
      </section>

      {/* SERMON */}
      <section className="sermon" id="sermons" aria-label="Latest sermons">
        <div className="sermon__inner">
          <div className="section-head section-head--split">
            <div className="reveal">
              <span className="kicker">Messages from the Pulpit</span>
              <h2 className="display display--lg">Latest<br /><em>sermons.</em></h2>
            </div>
            <p className="lede reveal">
              Weekly exposition of the Word, archived here for reflection, family devotion, and ongoing discipleship.
            </p>
          </div>

          <div className="sermon__grid">
            <div className="sermon__media reveal">
              {playing && featuredEmbed ? (
                <div className="sermon__player">
                  <iframe
                    src={`${featuredEmbed}?autoplay=1&rel=0`}
                    title={featured?.title || 'Sermon'}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <>
                  <div className="illuminated">
                    <div className="illuminated__book">{featured?.series || 'The Epistle to the Romans'}</div>
                    <div className="illuminated__chapter">{featured?.scripture ? featured.scripture.replace(/[^0-9].*$/, '') || '✦' : 'VIII'}</div>
                    <div className="illuminated__ornament" aria-hidden="true">✦ · ✦</div>
                  </div>
                  <button
                    className="sermon__play"
                    aria-label="Play sermon"
                    type="button"
                    onClick={() => { if (featuredEmbed) setPlaying(true); else if (featured?.videoUrl) window.open(featured.videoUrl, '_blank', 'noopener'); }}
                  >
                    <svg width="30" height="30" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z" /></svg>
                  </button>
                  <div className="sermon__caption">
                    <span>{featured?.duration || ''}</span>
                    <span className="scripture">{featured?.scripture || ''}</span>
                  </div>
                </>
              )}
            </div>

            <div className="sermon__text reveal">
              <div className="sermon__series">
                <span>Series</span><span className="dot">·</span><span>{featured?.series || 'Romans · The Gospel of Grace'}</span>
              </div>
              <h3 className="display display--md">{featured?.title || <>Sermons from the<br /><em>General Assembly.</em></>}</h3>
              <p className="sermon__ref">{featured ? [featured.scripture, featured.speaker, featured.duration].filter(Boolean).join(' · ') : 'Sermons from the General Assembly will appear here.'}</p>
              <p className="sermon__blurb">
                {featured?.description || 'What does it mean that the Spirit gives life where the law could only condemn? An exposition on the great hinge of the eighth chapter — and what it sets free in the ordinary Christian’s ordinary week.'}
              </p>

              <div className="hymnal-index">
                <div className="hymnal-index__head">
                  <span>No.</span>
                  <span>Sermon</span>
                  <span>Reference</span>
                </div>
                {(sermons.length
                  ? sermons.slice(0, 5).map((s, i) => ({ n: String(sermons.length - i).padStart(3, '0'), title: s.title || 'Untitled', em: '', ref: s.scripture || s.speaker || '' }))
                  : []
                ).map((row, i) => (
                  <button
                    key={row.n + i}
                    type="button"
                    className={`hymnal-row${i === activeSermon ? ' is-active' : ''}`}
                    onClick={() => { setActiveSermon(i); setPlaying(false); }}
                  >
                    <span className="hymnal-row__num">{row.n}</span>
                    <span className="hymnal-row__title">
                      {row.title} {row.em && <em>{row.em}</em>}
                      <span className="hymnal-row__leader" />
                    </span>
                    <span className="hymnal-row__ref">{row.ref}</span>
                  </button>
                ))}
              </div>

              <Link to="/library" className="btn btn--link" style={{ marginTop: '0.75rem' }}>Sermon archive →</Link>
            </div>
          </div>
        </div>
      </section>

      <Divider width={160} />

      {/* SUNDAYS AT PCP */}
      <section className="sundays" aria-label="Sundays at PCP">
        <div className="sundays__bg" data-parallax="0.10">
          <div className="img-placeholder" />
        </div>
        <div className="sundays__inner reveal">
          <span className="kicker kicker--on-dark" style={{ color: 'var(--brass-bright)' }}>A Lord’s Day at PCP</span>
          <h2 className="sundays__title">Worship as the saints have, <em>for centuries.</em></h2>
          <p className="sundays__lede">
            Our Sunday services follow the simple, scripted pattern of historic Reformed worship — the same five movements you would have found in a Geneva chapel in 1559, or a Cordillera barrio in 1928.
          </p>
          <div className="order-of-worship">
            {[
              { r: 'I.', n: 'Call to Worship', s: 'Psalm · Invocation' },
              { r: 'II.', n: 'Confession', s: 'Sin · Pardon' },
              { r: 'III.', n: 'The Word', s: 'Reading · Sermon' },
              { r: 'IV.', n: 'The Table', s: 'Monthly · Communion' },
              { r: 'V.', n: 'Benediction', s: 'Sending · Doxology' },
            ].map((step) => (
              <div key={step.r} className="order-of-worship__step">
                <span className="roman">{step.r}</span>
                <span className="name">{step.n}</span>
                <span className="sub">{step.s}</span>
              </div>
            ))}
          </div>
          <p
            className="sundays__lede"
            style={{ maxWidth: '44ch', fontStyle: 'italic', color: 'rgba(251,244,220,0.65)', fontSize: '1rem' }}
          >
            Walang ceremonya na masyadong elaborate. The Word, the Table, and the people gathered — that is enough.
          </p>
        </div>
      </section>

      {/* MOTTO + MISSION */}
      <section className="mv" id="mission" aria-label="Mission &amp; Vision">
        <div className="mv__inner">
          <div className="mv__motto reveal">
            <span className="kicker kicker--brass">The Denominational Motto</span>
            <p className="mv__motto-text">
              {cms.mv?.motto ? `“${cms.mv.motto}”` : <>“To glorify God <em>and to enjoy Him forever.</em>”</>}
            </p>
            <div className="sdg-seal reveal reveal--scale">
              <span className="sdg-seal__diamond">✦</span>
              <span className="sdg-seal__words">Soli Deo<br />Gloria</span>
              <span className="sdg-seal__cite">A · D · MDCXLVII</span>
            </div>
            <p className="mv__motto-cite">Westminster Shorter Catechism · Question I.</p>
          </div>

          <div className="mv__pillars">
            <div className="mv__pillars-intro reveal">
              <span className="kicker">Our Calling</span>
              <h2 className="display display--lg">Five tasks,<br /><em>one Lord.</em></h2>
              <p className="lede">
                {cms.mv?.summary || 'As a Reformed and Presbyterian denomination under the authority of Scripture and the Lordship of Jesus Christ, we are called to:'}
              </p>
              <p className="mv__pillars-tag">Established in grace · moving in faith.</p>
            </div>

            <ol className="pillars-list">
              {(() => {
                const ROMANS = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.', 'X.'];
                const HARD = [
                  { h: 'Go,', em: 'make disciples.', p: 'Nurture believers to maturity through Word, Sacrament and prayer.' },
                  { h: 'Advance', em: 'the mission.', p: 'Proclaim the gospel of grace locally and globally, in mercy and justice.' },
                  { h: 'Grow', em: 'the church.', p: 'Plant, strengthen, and revitalize confessional Presbyterian congregations.' },
                  { h: 'Develop', em: 'leaders.', p: 'Train faithful pastors, elders and deacons for worship, service and witness.' },
                  { h: 'Uphold', em: 'the Reformed faith.', p: 'Preserve the confessional heritage and promote unity among Reformed bodies.' },
                ];
                const items = cms.mv?.missionPoints?.length
                  ? cms.mv.missionPoints.map((m) => ({ title: m.title, p: m.sub }))
                  : HARD.map((x) => ({ title: <>{x.h} <em>{x.em}</em></>, p: x.p }));
                return items.map((it, i) => (
                  <li key={i} className="reveal">
                    <span className="num">{ROMANS[i] || `${i + 1}.`}</span>
                    <div>
                      <h4>{it.title}</h4>
                      <p>{it.p}</p>
                    </div>
                  </li>
                ));
              })()}
            </ol>
          </div>
        </div>
      </section>

      {/* COMMITTEES */}
      <section className="committees" id="committees" aria-label="Standing committees">
        <div className="committees__inner">
          <div className="section-head reveal">
            <span className="kicker">Governance</span>
            <h2 className="display display--lg">Standing<br /><em>committees.</em></h2>
            <p className="lede">
              Nine committees carry out the ministries and administrative work of the General Assembly between sessions. Select a committee to view its standing rules and officers.
            </p>
          </div>
          <ul className={`committees__list${showAllCommittees ? '' : ' is-collapsed'}`}>
            {committees.map((c, i) => {
              const romans = ['I.', 'II.', 'III.', 'IV.', 'V.', 'VI.', 'VII.', 'VIII.', 'IX.'];
              return (
                <li key={c.name}>
                  <button className="committees__card reveal" type="button" onClick={() => openCommittee(i)}>
                    <span className="committees__num">{romans[i]}</span>
                    <h4>{c.name}</h4>
                    <p>{c.description.length > 140 ? c.description.slice(0, 140) + '…' : c.description}</p>
                    <span className="committees__cta">View rules →</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {committees.length > 5 && (
            <button type="button" className="show-more" onClick={() => setShowAllCommittees((v) => !v)}>
              {showAllCommittees ? 'Show less' : `View all ${committees.length} committees`}
              <span className="show-more__chev" aria-hidden="true">{showAllCommittees ? '↑' : '↓'}</span>
            </button>
          )}
        </div>
      </section>

      {/* PRESBYTERIES + MAP */}
      <section className="presbyteries" id="presbyteries" aria-label="Presbyteries">
        <div className="presbyteries__inner">
          <div className="section-head section-head--split">
            <div className="reveal">
              <span className="kicker">Across the Archipelago</span>
              <h2 className="display display--lg">{presbyteries.length} presbyteries.<br /><em>One communion.</em></h2>
            </div>
            <p className="lede reveal">
              From the Cordilleras to Mindanao, our congregations gather weekly to hear the Word preached and the Sacraments rightly administered.
            </p>
          </div>

          <div className="presbyteries__layout">
            <aside className="ph-map reveal">
              <div className="ph-map__label">— Map of the Communion —</div>
              <PhilippinesMap />
              <div className="ph-map__legend">
                <span className="pin" />
                <span>Seat of Presbytery · mga kongregasyon</span>
              </div>
            </aside>

            <div className={`presbyteries__col${showAllPres ? '' : ' is-collapsed'}`}>
              {presbyteriesByRegion.map((region) => (
                <div key={region.region} className="presbyteries__region reveal">
                  <div className="presbyteries__region-head">
                    <span className="num">{region.num}</span>
                    <h3>{region.title} {region.emTitle && <em>{region.emTitle}</em>}</h3>
                    <span className="count">{region.count}</span>
                  </div>
                  <div className="presbyteries__grid">
                    {region.items.map((p) => {
                      const [first, ...rest] = (p.name || '').split(' ');
                      const count = congregationCount(p);
                      return (
                        <button
                          key={`${p.id || p.name || 'p'}-${p._idx}`}
                          type="button"
                          className="presbyteries__card"
                          onClick={() => openPresbytery(p._idx)}
                        >
                          <span className="presbyteries__num">{p._roman}</span>
                          <div className="presbyteries__body">
                            <h4>{first} {rest.length > 0 && <em>{rest.join(' ')}</em>}</h4>
                            {p.seat && <span className="presbyteries__seat">Seat · {p.seat}</span>}
                            {count > 0 && (
                              <span className="presbyteries__count">
                                {count} {count === 1 ? 'congregation' : 'congregations'}
                              </span>
                            )}
                          </div>
                          <span className="presbyteries__arrow">→</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {presbyteriesByRegion.length > 2 && (
                <button type="button" className="show-more" onClick={() => setShowAllPres((v) => !v)}>
                  {showAllPres ? 'Show less' : `View all ${presbyteries.length} presbyteries`}
                  <span className="show-more__chev" aria-hidden="true">{showAllPres ? '↑' : '↓'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* RESOURCES */}
      <section className="dark-section" id="resources" aria-label="Official governance documents">
        <div className="resources__inner">
          <div className="section-head reveal">
            <span className="kicker kicker--on-dark" style={{ color: 'var(--brass-bright)' }}>Official Governance · The Library</span>
            <h2 className="display display--lg on-dark">Vision &amp;<br /><em>constitutions.</em></h2>
            <p className="lede lede--on-dark">
              Foundational documents that define our heritage, discipline and direction.
            </p>
          </div>
          <div className="resources__grid">
            {[
              { cat: 'Constitution', ed: 'Ed. iv · MMXV', title: 'The Book of', em: 'Church Order', meta: 'Government · Discipline · Worship', body: 'The constitution of the Presbyterian Church of the Philippines as amended and approved at the 20th General Assembly, 4 November 2015.', cta: 'Download PDF' },
              { cat: 'Standards', ed: 'A.D. MDCXLVII', title: 'Westminster', em: 'Standards.', meta: 'Confession · Larger & Shorter Catechisms', body: 'The doctrinal standards of the Presbyterian Church — the Confession of Faith and the two Catechisms drafted at Westminster Abbey, 1647.', cta: 'Download PDF' },
              { cat: 'Vision', ed: 'MMXXVI – MMXXX', title: 'Strategic', em: 'Directions.', meta: 'Five-Year Plan of the General Assembly', body: 'Plans adopted by the General Assembly for the next five years of ministry, mission, education and church planting.', cta: 'Open in Library' },
            ].map((b) => (
              <article key={b.cat} className="book-card reveal reveal--book">
                <div className="book-card__head">
                  <span className="book-card__cat">{b.cat}</span>
                  <span className="book-card__edition">{b.ed}</span>
                </div>
                <h4>{b.title}<br /><em>{b.em}</em></h4>
                <span className="book-card__meta">{b.meta}</span>
                <p>{b.body}</p>
                <Link to="/library" className="book-card__cta">
                  {b.cta}
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                    <polyline points="7 10 12 15 17 10" />
                    <line x1="12" y1="15" x2="12" y2="3" />
                  </svg>
                </Link>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* GIVE */}
      <section className="dark-section" id="donate" aria-label="Give">
        <div className="give__inner">
          <div className="give__copy reveal">
            <span className="kicker kicker--on-dark" style={{ color: 'var(--brass-bright)' }}>Stewardship</span>
            <h2 className="display display--lg on-dark">
              Give as you have<br /><em>purposed in your heart.</em>
            </h2>
            <p className="give__cite">— II Corinthians ix : 7</p>
            <p className="give__scripture">
              Every man according as he purposeth in his heart, so let him give; not grudgingly, or of necessity: for God loveth a cheerful giver.
            </p>
            <p className="lede lede--on-dark">
              Your gifts sustain the preaching of the Word, the training of pastors, the planting of congregations, and the mercy ministries of the Church across the islands.
            </p>
          </div>

          <div className="covenant-card reveal reveal--scale">
            <div className="covenant-card__head">
              <div className="covenant-card__kicker">— A Card of Stewardship —</div>
              <div className="covenant-card__title">For the work of the Gospel</div>
            </div>
            <div>
              <label className="give-form__label">Your name (optional)</label>
              <input
                className="give-form__input"
                type="text"
                placeholder="Anonymous"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
              />
            </div>
            <div>
              <label className="give-form__label">Choose an amount</label>
              <div className="give-form__amounts">
                {GIVE_AMOUNTS.map((amt, i) => (
                  <button
                    key={amt}
                    type="button"
                    className={`give-form__chip${i === activeAmount ? ' is-active' : ''}`}
                    onClick={() => setActiveAmount(i)}
                  >
                    ₱{amt.toLocaleString()}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="button"
              className="btn btn--primary"
              style={{ width: '100%', justifyContent: 'center', padding: '1.1rem' }}
              onClick={() => {
                const amt = GIVE_AMOUNTS[activeAmount] || 1000;
                const q = new URLSearchParams({ amount: String(amt) });
                if (donorName.trim()) q.set('name', donorName.trim());
                navigate(`/donation?${q.toString()}`);
              }}
            >
              Donate Now
            </button>
            <p
              className="give-form__note"
              style={{
                marginTop: '1rem',
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                color: 'rgba(251,244,220,0.65)',
                fontSize: '0.92rem',
                lineHeight: 1.5,
              }}
            >
              Secure online giving via GCash, Maya, cards &amp; bank — powered by Xendit. Questions? Write to{' '}
              <a
                href="mailto:pcpgainfo@gmail.com"
                style={{ color: 'var(--brass-bright)', borderBottom: '1px solid currentColor' }}
              >
                pcpgainfo@gmail.com
              </a>.
            </p>
          </div>
        </div>
      </section>

      {/* INVITATION */}
      <section className="invitation" id="visit" aria-label="You are invited">
        <div className="invitation__bg" data-parallax="0.18">
          <img src="/pcp-hero.jpg" alt="" loading="lazy" decoding="async" />
        </div>
        <div className="invitation__inner reveal">
          <span className="kicker kicker--on-dark" style={{ color: 'var(--brass-bright)' }}>You’re Invited</span>
          <h2 className="invitation__title">You belong <em>here.</em></h2>
          <p className="invitation__lede">
            No matter where you are on your journey, there is a seat at our table. Come worship with us this Lord’s Day.
          </p>
          <div className="invitation__actions">
            <a href="#presbyteries" className="btn btn--primary">Find a Church Near You</a>
            <a href="#donate" className="btn btn--ghost-light">Partner with Us</a>
          </div>
          <div className="invitation__strip">
            <div><span className="label">Sundays</span><span className="value">9:00 &amp; 11:00 AM</span></div>
            <div><span className="label">Wednesdays</span><span className="value">7:00 PM</span></div>
            <div><span className="label">Location</span><span className="value">Metro Manila</span></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="foot" role="contentinfo">
        <div className="foot__inner">
          <div className="foot__benediction">
            <span className="foot__benediction-kicker">Benediction</span>
            <p className="foot__benediction-text">
              “Now unto Him that is able to keep you from falling, and to present you faultless before the presence of His glory with exceeding joy…”
            </p>
            <span className="foot__benediction-cite">Jude · 24</span>
          </div>

          <div className="foot__top">
            <div>
              <div className="foot__brand">
                <img src="/pcpga_logo.png" alt="" className="foot__logo" loading="lazy" decoding="async" />
                <div>
                  <div className="foot__name">{cms.identity?.name ? `${cms.identity.name}${cms.identity.sub ? ' ' + cms.identity.sub : ''}` : 'Presbyterian Church of the Philippines'}</div>
                  <div className="foot__sub">General Assembly · Est. MCMLXXXVII</div>
                </div>
              </div>
              <p className="foot__desc">
                {cms.identity?.footerDesc || 'Serving the Philippines since 1987 — proclaiming the Gospel, equipping believers, and planting confessional Presbyterian congregations across the nation.'}
              </p>
            </div>

            <div className="foot__cols">
              <div>
                <h5>Ministry</h5>
                <ul>
                  <li><a href="#message">About</a></li>
                  <li><a href="#sermons">Sermons</a></li>
                  <li><a href="#presbyteries">Find a Church</a></li>
                  <li><Link to="/donation">Give Online</Link></li>
                </ul>
              </div>
              <div>
                <h5>Resources</h5>
                <ul>
                  <li><Link to="/library">Westminster Standards</Link></li>
                  <li><Link to="/library">Book of Order</Link></li>
                  <li><Link to="/library">Digital Library</Link></li>
                  <li><a href="/admin">Admin Panel</a></li>
                </ul>
              </div>
              <div>
                <h5>Contact</h5>
                <ul>
                  <li>#42 Banaag Street, Brgy. Pineda, Pasig City</li>
                  <li>{cms.identity?.social?.email || 'pcpgainfo@gmail.com'}</li>
                  <li>(02) 935 4741</li>
                  <li className="social">
                    <a href={cms.identity?.social?.facebook || '#'}>Facebook</a>
                    <a href={cms.identity?.social?.youtube || '#'}>YouTube</a>
                    <a href={cms.identity?.social?.instagram || '#'}>Instagram</a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div className="foot__solas">
            {[
              ['Sola Scriptura', 'Scripture Alone'],
              ['Sola Gratia', 'Grace Alone'],
              ['Sola Fide', 'Faith Alone'],
              ['Solus Christus', 'Christ Alone'],
              ['Soli Deo Gloria', 'To God Alone Be Glory'],
            ].map(([name, tr]) => (
              <div key={name} className="sola">
                <span className="sola__name">{name}</span>
                <span className="sola__tr">{tr}</span>
              </div>
            ))}
          </div>

          <div className="foot__bottom">
            <span>© MMXXVI · Presbyterian Church of the Philippines</span>
            <em>To the glory of God alone.</em>
          </div>
        </div>
      </footer>

      {/* MODAL */}
      <div
        className="modal-backdrop"
        aria-hidden={modal === null}
        onClick={(e) => { if (e.target === e.currentTarget) closeModal(); }}
      >
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <button className="modal__close" aria-label="Close" type="button" onClick={closeModal}>×</button>
          {modal && modal.kind === 'committee' && <CommitteeModal data={committees[modal.i]} />}
          {modal && modal.kind === 'presbytery' && <PresbyteryModal data={presbyteries[modal.i]} />}
        </div>
      </div>

      {/* Announcement popup — shows once per visitor when active (Site Content → Announcement) */}
      <AnnouncementModal />
      <MobileScrollAids />
    </>
  );
}

function OfficerList({ officers }) {
  if (!officers || !officers.length) return null;
  return (
    <div className="modal__officers">
      {officers.map((o) => (
        <div key={o.name} className="modal__officer">
          <div className="modal__officer-photo">
            {o.photo ? <img src={o.photo} alt={o.name} loading="lazy" decoding="async" /> : (o.name || '·').trim().charAt(0)}
          </div>
          <div className="modal__officer-name">{o.name}</div>
          {o.role && <div className="modal__officer-role">{o.role}</div>}
        </div>
      ))}
    </div>
  );
}

function CommitteeModal({ data }) {
  return (
    <>
      <div className="modal__eyebrow">Standing Rules &amp; Duties</div>
      <h3 className="modal__title" id="modal-title">{data.name}</h3>
      <div className="modal__sub">{data.sub}</div>
      <div className="modal__body">
        <p>{data.description}</p>
        {data.duties && data.duties.length > 0 && (
          <>
            <div className="modal__section-title">Standing Duties</div>
            <ul className="modal__list">
              {data.duties.map((d) => <li key={d}>{d}</li>)}
            </ul>
          </>
        )}
        {data.officers && data.officers.length > 0 && (
          <>
            <div className="modal__section-title">Commissioned Officers</div>
            <OfficerList officers={data.officers} />
          </>
        )}
      </div>
    </>
  );
}

function PresbyteryModal({ data }) {
  const churchCount = Array.isArray(data.churches) ? data.churches.length : (data.congregations || 0);
  return (
    <>
      <div className="modal__eyebrow">Presbytery · {data.region}</div>
      <h3 className="modal__title" id="modal-title">{data.name}</h3>
      <div className="modal__sub">{data.seat ? `Seat · ${data.seat}` : ''}</div>
      <div className="modal__body">
        {data.description && <p>{data.description}</p>}
        {(data.seat || data.founded || churchCount > 0) && (
          <>
            <div className="modal__section-title">At a Glance</div>
            <ul className="modal__list">
              {data.seat && <li>Seat — {data.seat}</li>}
              {data.founded && <li>Founded — A.D. {data.founded}</li>}
              {churchCount > 0 && <li>{churchCount} {churchCount === 1 ? 'congregation' : 'congregations'} across the region</li>}
            </ul>
          </>
        )}
        {data.officers && data.officers.length > 0 && (
          <>
            <div className="modal__section-title">Executive Committee</div>
            <OfficerList officers={data.officers} />
          </>
        )}
        {Array.isArray(data.churches) && data.churches.length > 0 && (
          <>
            <div className="modal__section-title">Member Churches ({data.churches.length})</div>
            <div className="modal__churches">
              {data.churches.map((ch, idx) => (
                <article key={ch.name || idx} className="modal__church">
                  <h4 className="modal__church-name">{ch.name}</h4>
                  {ch.address && <p className="modal__church-line"><strong>Address:</strong> {ch.address}</p>}
                  {ch.minister && <p className="modal__church-line"><strong>Minister:</strong> {ch.minister}</p>}
                  {ch.associatePastors?.length > 0 && (
                    <p className="modal__church-line"><strong>Associate Pastors:</strong> {ch.associatePastors.join(', ')}</p>
                  )}
                  {ch.worshipTime && <p className="modal__church-line"><strong>Worship:</strong> {ch.worshipTime}</p>}
                  {ch.contact && <p className="modal__church-line"><strong>Contact:</strong> {ch.contact}</p>}
                  {ch.email && (
                    <p className="modal__church-line">
                      <strong>Email:</strong>{' '}
                      <a href={`mailto:${ch.email}`}>{ch.email}</a>
                    </p>
                  )}
                  {ch.elders?.length > 0 && (
                    <p className="modal__church-line"><strong>Elders:</strong> {ch.elders.join(', ')}</p>
                  )}
                </article>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
