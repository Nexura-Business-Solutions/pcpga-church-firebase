// Pure, non-destructive merge of the authoritative default directory into the
// live (admin-edited) presbyteries array. Matches by normalized name, upserts
// churches, and never deletes live entries or clobbers live-only fields.

export function normalizeName(value) {
  if (typeof value !== 'string') return '';
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

function mergeChurch(liveChurch, defaultChurch) {
  // Start from live (preserves live-only fields like photoUrl), then overwrite
  // with any non-empty field from defaults (authoritative directory values).
  const merged = { ...liveChurch };
  for (const [key, val] of Object.entries(defaultChurch)) {
    const isEmpty = val === undefined || val === null || val === '' ||
      (Array.isArray(val) && val.length === 0);
    if (!isEmpty) merged[key] = val;
  }
  return merged;
}

function mergeChurches(liveChurches = [], defaultChurches = []) {
  const result = liveChurches.map((c) => ({ ...c }));
  const indexByName = new Map(
    result.flatMap((c, i) => { const k = normalizeName(c.name); return k ? [[k, i]] : []; })
  );
  for (const dc of defaultChurches) {
    const key = normalizeName(dc.name);
    if (!key) { result.push({ ...dc }); continue; }
    if (indexByName.has(key)) {
      const i = indexByName.get(key);
      result[i] = mergeChurch(result[i], dc);
    } else {
      result.push({ ...dc });
      indexByName.set(key, result.length - 1);
    }
  }
  return result;
}

export function mergePresbyteries(live = [], defaults = []) {
  const result = live.map((p) => ({ ...p }));
  const indexByName = new Map(
    result.flatMap((p, i) => { const k = normalizeName(p.name); return k ? [[k, i]] : []; })
  );
  for (const dp of defaults) {
    const key = normalizeName(dp.name);
    if (!key) { result.push({ ...dp }); continue; }
    if (indexByName.has(key)) {
      const i = indexByName.get(key);
      const livePres = result[i];
      const officers = Array.isArray(dp.officers) && dp.officers.length > 0
        ? dp.officers
        : (livePres.officers || []);
      result[i] = {
        ...mergeChurch(livePres, dp),
        officers,
        churches: mergeChurches(livePres.churches, dp.churches),
      };
    } else {
      result.push({ ...dp });
      indexByName.set(key, result.length - 1);
    }
  }
  return result;
}
