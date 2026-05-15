import { describe, it, expect, vi } from 'vitest';

vi.mock('../../src/lib/firebase.js', () => ({ storage: {} }));

const refMock = vi.fn(() => ({ _ref: 'ref' }));
const uploadTaskMock = {
  on: vi.fn(),
  snapshot: { ref: { fullPath: 'path' } },
};
const uploadBytesResumableMock = vi.fn(() => uploadTaskMock);
const getDownloadURLMock = vi.fn(async () => 'https://storage/url');

vi.mock('firebase/storage', () => ({
  ref: (...a) => refMock(...a),
  uploadBytesResumable: (...a) => uploadBytesResumableMock(...a),
  getDownloadURL: (...a) => getDownloadURLMock(...a),
}));

import { uploadFile } from '../../src/lib/storage.js';

describe('uploadFile', () => {
  it('resolves with downloadURL on success, calls onProgress on update', async () => {
    const onProgress = vi.fn();
    uploadTaskMock.on.mockImplementation((_evt, onProg, _onErr, onComplete) => {
      onProg({ bytesTransferred: 50, totalBytes: 100 });
      onComplete();
    });

    const url = await uploadFile('hero/test.jpg', new Blob(['hi']), onProgress);

    expect(onProgress).toHaveBeenCalledWith(50);
    expect(url).toBe('https://storage/url');
  });

  it('rejects when upload fires error', async () => {
    uploadTaskMock.on.mockImplementation((_evt, _onProg, onErr) => {
      onErr(new Error('boom'));
    });
    await expect(uploadFile('x', new Blob(['hi']))).rejects.toThrow('boom');
  });
});
