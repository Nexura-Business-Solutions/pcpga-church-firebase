// Store façade — preserves the source data-access API names but routes
// through our Firebase libs (firestore.js + storage.js). Components in this
// repo import these functions exactly like the Next.js source did.
import {
  listSermons, createSermon, updateSermon as fsUpdateSermon, deleteSermon as fsDeleteSermon,
  listLibrary, createLibraryItem, updateLibraryItem, deleteLibraryItem,
  createChurch, updateChurch as fsUpdateChurch, deleteChurch as fsDeleteChurch,
  getSetting, setSetting,
} from './firestore.js';
import { defaultPresbyteries, defaultSeminaries } from './seed-data.js';

// ---------- Churches ----------
// The "Find a Church" finder is DERIVED from settings/presbyteries (the single
// source of truth, edited in the Content Manager). This keeps the homepage
// presbytery directory and the finder perfectly in sync — one edit updates both,
// no separate `churches` collection to drift out of date.
function _slug(s) {
  return String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}
function _province(addr) {
  const parts = String(addr || '').split(',').map((s) => s.trim()).filter(Boolean);
  const last = (parts[parts.length - 1] || '').replace(/\b\d{4}\b/, '').trim();
  return last || (parts[parts.length - 2] || '');
}
export function churchesFromPresbyteries(presbyteries) {
  const rows = [];
  for (const p of (Array.isArray(presbyteries) ? presbyteries : [])) {
    for (const c of (p.churches || [])) {
      // A finder entry needs a location; address-less roster churches (e.g. a
      // leadership-only directory) stay in the presbytery section only.
      if (!c || !c.address || !String(c.address).trim()) continue;
      rows.push({
        id: `${_slug(p.name)}--${_slug(c.name)}`, // unique per presbytery+church (no name collisions)
        name: c.name,
        address: c.address,
        region: p.region || '',
        province: _province(c.address),
        pastor: c.minister || c.moderatorInCharge || c.pastor || '',
        serviceTime: c.worshipTime || '',
        presbytery: p.name,
        mapLink: c.mapLink || undefined,
      });
    }
  }
  return rows;
}
export async function getChurches() {
  try {
    return churchesFromPresbyteries(await getSettings('presbyteries'));
  } catch (e) {
    console.error('getChurches error:', e);
    return [];
  }
}

export async function addChurch(church) {
  try {
    const id = await createChurch(church);
    return { id, ...church };
  } catch (e) {
    console.error('addChurch error:', e);
    return null;
  }
}

export async function updateChurch(id, updated) {
  try {
    await fsUpdateChurch(id, updated);
    return { id, ...updated };
  } catch (e) {
    console.error('updateChurch error:', e);
    return null;
  }
}

export async function deleteChurch(id) {
  try {
    await fsDeleteChurch(id);
    return true;
  } catch (e) {
    console.error('deleteChurch error:', e);
    return false;
  }
}

// ---------- Sermons ----------
export async function getSermons() {
  try {
    return await listSermons();
  } catch (e) {
    console.error('getSermons error:', e);
    return [];
  }
}

export async function addSermon(sermon) {
  try {
    const id = await createSermon(sermon);
    return { id, ...sermon };
  } catch (e) {
    console.error('addSermon error:', e);
    return null;
  }
}

export async function updateSermon(id, updated) {
  try {
    await fsUpdateSermon(id, updated);
    return { id, ...updated };
  } catch (e) {
    console.error('updateSermon error:', e);
    return null;
  }
}

export async function deleteSermon(id) {
  try {
    await fsDeleteSermon(id);
    return true;
  } catch (e) {
    console.error('deleteSermon error:', e);
    return false;
  }
}

// ---------- Library ----------
export async function getLibraryResources() {
  try {
    return await listLibrary();
  } catch (e) {
    console.error('getLibraryResources error:', e);
    return [];
  }
}

export async function addLibraryResource(item) {
  try {
    const id = await createLibraryItem(item);
    return { id, ...item };
  } catch (e) {
    console.error('addLibraryResource error:', e);
    return null;
  }
}

export async function updateLibraryResource(id, updated) {
  try {
    await updateLibraryItem(id, updated);
    return { id, ...updated };
  } catch (e) {
    console.error('updateLibraryResource error:', e);
    return null;
  }
}

export async function deleteLibraryResource(id) {
  try {
    await deleteLibraryItem(id);
    return true;
  } catch (e) {
    console.error('deleteLibraryResource error:', e);
    return false;
  }
}

// ---------- Hero / Donation / Settings ----------
export async function getHeroContent() {
  return await getSettings('hero');
}

export async function saveHeroContent(content) {
  return await saveSettings('hero', content);
}

export async function getDonationContent() {
  return await getSettings('donations');
}

export async function saveDonationContent(content) {
  return await saveSettings('donations', content);
}

export async function getSettings(key) {
  try {
    const data = await getSetting(key);
    const arrayKeys = ['standing-committees', 'presbyteries', 'seminaries', 'upcoming-events', 'welcome-officers', 'video-greetings', 'recent-events'];
    if (arrayKeys.includes(key)) {
      if (!data || (typeof data === 'object' && !Array.isArray(data) && Object.keys(data).length === 0)) {
        return [];
      }
      return Array.isArray(data) ? data : [];
    }
    return data;
  } catch (e) {
    console.error(`getSettings(${key}) error:`, e);
    return null;
  }
}

export async function saveSettings(key, value) {
  try {
    await setSetting(key, value);
    return true;
  } catch (e) {
    console.error(`saveSettings(${key}) error:`, e);
    return false;
  }
}

// ---------- Seminaries ----------
export async function getSeminaries() {
  return await getSettings('seminaries');
}

export async function saveSeminaries(list) {
  return await saveSettings('seminaries', list);
}

// ---------- initStore ----------
// Source initStore prefetches presbyteries seed data; we keep the same behavior.
export async function initStore() {
  try {
    const py = await getSettings('presbyteries');
    if (!py || (Array.isArray(py) && py.length === 0) || (typeof py === 'object' && Object.keys(py).length === 0)) {
      await saveSettings('presbyteries', defaultPresbyteries);
    }
  } catch (e) {
    console.error('initStore error:', e);
  }

  try {
    const sem = await getSettings('seminaries');
    if (!sem || (Array.isArray(sem) && sem.length === 0) || (typeof sem === 'object' && Object.keys(sem).length === 0)) {
      await saveSettings('seminaries', defaultSeminaries);
    }
  } catch (e) {
    console.error('initStore seminaries error:', e);
  }
}
