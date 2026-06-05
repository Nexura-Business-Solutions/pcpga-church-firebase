import { useEffect, useState } from 'react';

// Mobile-only reading aids for the long landing page: a thin scroll-progress
// bar pinned at the very top, and a back-to-top button that fades in once the
// visitor has scrolled past the first screen. Both are hidden on desktop via
// CSS (body.lp-v3 .scrollbar / .to-top are display:none above 768px).
export default function MobileScrollAids() {
    const [progress, setProgress] = useState(0);
    const [showTop, setShowTop] = useState(false);

    useEffect(() => {
        let raf = 0;
        const update = () => {
            raf = 0;
            const el = document.documentElement;
            const max = el.scrollHeight - el.clientHeight;
            const y = window.scrollY || el.scrollTop || 0;
            setProgress(max > 0 ? Math.min(1, y / max) : 0);
            setShowTop(y > 700);
        };
        const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
        update();
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onScroll, { passive: true });
        return () => {
            window.removeEventListener('scroll', onScroll);
            window.removeEventListener('resize', onScroll);
            if (raf) cancelAnimationFrame(raf);
        };
    }, []);

    const toTop = () => {
        const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' });
    };

    return (
        <>
            <div className="scrollbar" aria-hidden="true">
                <div className="scrollbar__fill" style={{ transform: `scaleX(${progress})` }} />
            </div>
            <button
                type="button"
                className={`to-top${showTop ? ' is-visible' : ''}`}
                onClick={toTop}
                aria-label="Back to top"
            >
                ↑
            </button>
        </>
    );
}
