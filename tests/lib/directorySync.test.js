import { describe, it, expect } from 'vitest';
import { normalizeName, mergePresbyteries } from '../../src/lib/directorySync.js';

describe('normalizeName', () => {
  it('lowercases, trims, and collapses whitespace', () => {
    expect(normalizeName('  Grace   Community  ')).toBe('grace community');
  });
  it('handles non-strings safely', () => {
    expect(normalizeName(undefined)).toBe('');
  });
  it('returns empty string for null and numbers', () => {
    expect(normalizeName(null)).toBe('');
    expect(normalizeName(42)).toBe('');
  });
});

describe('mergePresbyteries', () => {
  it('adds a presbytery present only in defaults', () => {
    const live = [];
    const defaults = [{ id: '1', name: 'Bulacan Presbytery', region: 'Luzon', officers: [], churches: [] }];
    const out = mergePresbyteries(live, defaults);
    expect(out).toHaveLength(1);
    expect(out[0].name).toBe('Bulacan Presbytery');
  });

  it('adds a default church to a matched presbytery', () => {
    const live = [{ name: 'Bulacan Presbytery', officers: [], churches: [{ name: 'A' }] }];
    const defaults = [{ name: 'Bulacan Presbytery', officers: [], churches: [{ name: 'A' }, { name: 'B' }] }];
    const out = mergePresbyteries(live, defaults);
    expect(out[0].churches.map((c) => c.name).sort()).toEqual(['A', 'B']);
  });

  it('overwrites a stale field on a matched church from defaults', () => {
    const live = [{ name: 'P', officers: [], churches: [{ name: 'A', minister: 'Old' }] }];
    const defaults = [{ name: 'P', officers: [], churches: [{ name: 'A', minister: 'New' }] }];
    const out = mergePresbyteries(live, defaults);
    expect(out[0].churches[0].minister).toBe('New');
  });

  it('preserves a live-only photoUrl on a matched church', () => {
    const live = [{ name: 'P', officers: [], churches: [{ name: 'A', photoUrl: 'pic.jpg' }] }];
    const defaults = [{ name: 'P', officers: [], churches: [{ name: 'A', minister: 'New' }] }];
    const out = mergePresbyteries(live, defaults);
    expect(out[0].churches[0].photoUrl).toBe('pic.jpg');
    expect(out[0].churches[0].minister).toBe('New');
  });

  it('preserves a live-only church not present in defaults', () => {
    const live = [{ name: 'P', officers: [], churches: [{ name: 'A' }, { name: 'LiveOnly' }] }];
    const defaults = [{ name: 'P', officers: [], churches: [{ name: 'A' }] }];
    const out = mergePresbyteries(live, defaults);
    expect(out[0].churches.map((c) => c.name)).toContain('LiveOnly');
  });

  it('takes officers from defaults when defaults provide a non-empty list', () => {
    const live = [{ name: 'P', officers: [{ name: 'Old', role: 'Mod' }], churches: [] }];
    const defaults = [{ name: 'P', officers: [{ name: 'New', role: 'Mod' }], churches: [] }];
    const out = mergePresbyteries(live, defaults);
    expect(out[0].officers[0].name).toBe('New');
  });

  it('keeps live officers when defaults provide none', () => {
    const live = [{ name: 'P', officers: [{ name: 'Keep', role: 'Mod' }], churches: [] }];
    const defaults = [{ name: 'P', officers: [], churches: [] }];
    const out = mergePresbyteries(live, defaults);
    expect(out[0].officers[0].name).toBe('Keep');
  });

  it('never removes existing presbyteries', () => {
    const live = [{ name: 'LiveOnly Presbytery', officers: [], churches: [] }];
    const defaults = [{ name: 'Other Presbytery', officers: [], churches: [] }];
    const out = mergePresbyteries(live, defaults);
    expect(out.map((p) => p.name).sort()).toEqual(['LiveOnly Presbytery', 'Other Presbytery']);
  });

  it('preserves a live-only presbytery field when defaults omit it', () => {
    const live = [{ name: 'P', description: 'Admin edited', photoUrl: 'p.jpg', officers: [], churches: [] }];
    const defaults = [{ name: 'P', officers: [], churches: [] }];
    const out = mergePresbyteries(live, defaults);
    expect(out[0].description).toBe('Admin edited');
    expect(out[0].photoUrl).toBe('p.jpg');
  });

  it('does not collapse two unnamed presbyteries into one', () => {
    const live = [{ officers: [], churches: [] }];
    const defaults = [{ officers: [], churches: [] }];
    const out = mergePresbyteries(live, defaults);
    expect(out).toHaveLength(2);
  });
});
