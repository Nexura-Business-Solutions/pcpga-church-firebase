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

describe("getSettings('recent-events')", () => {
  beforeEach(() => { getSettingMock.mockReset(); });

  it('returns [] when the doc is missing', async () => {
    getSettingMock.mockResolvedValue(null);
    expect(await getSettings('recent-events')).toEqual([]);
  });

  it('returns [] when the doc is an empty object', async () => {
    getSettingMock.mockResolvedValue({});
    expect(await getSettings('recent-events')).toEqual([]);
  });

  it('returns the posts array when present', async () => {
    const posts = [{ id: 're-1', caption: 'Hello', photos: ['u1'], createdAt: 1 }];
    getSettingMock.mockResolvedValue(posts);
    expect(await getSettings('recent-events')).toEqual(posts);
  });
});

describe("getSettings('video-greetings-enabled')", () => {
  beforeEach(() => { getSettingMock.mockReset(); });

  it('passes the raw flag object through (not an array key)', async () => {
    getSettingMock.mockResolvedValue({ enabled: false });
    expect(await getSettings('video-greetings-enabled')).toEqual({ enabled: false });
  });

  it('returns null when the flag doc is missing', async () => {
    getSettingMock.mockResolvedValue(null);
    expect(await getSettings('video-greetings-enabled')).toBeNull();
  });
});
