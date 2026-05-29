import { describe, it, expect, vi, beforeEach } from 'vitest';

const getSettingMock = vi.fn();
const setSettingMock = vi.fn();

vi.mock('../../src/lib/firestore.js', () => ({
  listSermons: vi.fn(), createSermon: vi.fn(), updateSermon: vi.fn(), deleteSermon: vi.fn(),
  listLibrary: vi.fn(), createLibraryItem: vi.fn(), updateLibraryItem: vi.fn(), deleteLibraryItem: vi.fn(),
  listChurches: vi.fn(), createChurch: vi.fn(), updateChurch: vi.fn(), deleteChurch: vi.fn(),
  getSetting: (...a) => getSettingMock(...a),
  setSetting: (...a) => setSettingMock(...a),
}));

import { getSettings } from '../../src/lib/store.js';

describe("getSettings('seminaries')", () => {
  beforeEach(() => { getSettingMock.mockReset(); });

  it('returns [] when the doc is missing', async () => {
    getSettingMock.mockResolvedValue(null);
    expect(await getSettings('seminaries')).toEqual([]);
  });

  it('returns [] when the doc is an empty object', async () => {
    getSettingMock.mockResolvedValue({});
    expect(await getSettings('seminaries')).toEqual([]);
  });

  it('returns the array when present', async () => {
    getSettingMock.mockResolvedValue([{ id: 'ptscas' }]);
    expect(await getSettings('seminaries')).toEqual([{ id: 'ptscas' }]);
  });
});
