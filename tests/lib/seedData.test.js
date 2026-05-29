import { describe, it, expect } from 'vitest';
import { defaultSeminaries } from '../../src/lib/seed-data.js';

describe('defaultSeminaries', () => {
  it('contains PTSCAS and PBSI Bulacan Annex', () => {
    const ids = defaultSeminaries.map((s) => s.id);
    expect(ids).toContain('ptscas');
    expect(ids).toContain('pbsi-bulacan');
  });

  it('every seminary has the required shape', () => {
    for (const s of defaultSeminaries) {
      expect(typeof s.id).toBe('string');
      expect(typeof s.name).toBe('string');
      expect(typeof s.shortName).toBe('string');
      expect(['college', 'seminary']).toContain(s.type);
      expect(typeof s.about).toBe('string');
      expect(Array.isArray(s.mission)).toBe(true);
      expect(Array.isArray(s.statementOfFaith)).toBe(true);
      expect(Array.isArray(s.officers)).toBe(true);
      expect(Array.isArray(s.faculty)).toBe(true);
      expect(Array.isArray(s.programs)).toBe(true);
      expect(Array.isArray(s.admissions.whoMayApply)).toBe(true);
      expect(Array.isArray(s.admissions.requirements)).toBe(true);
      expect(typeof s.schedule).toBe('object');
    }
  });

  it('PBSI lists the Five Solas', () => {
    const pbsi = defaultSeminaries.find((s) => s.id === 'pbsi-bulacan');
    expect(pbsi.statementOfFaith).toHaveLength(5);
    expect(pbsi.statementOfFaith.map((x) => x.title)).toContain('Sola Scriptura');
  });
});
