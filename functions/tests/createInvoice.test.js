import { describe, it, expect, vi, beforeEach } from 'vitest';

const setDocMock = vi.fn();
const docMock = vi.fn(() => ({ set: setDocMock }));
const collectionMock = vi.fn(() => ({ doc: docMock }));
const dbMock = { collection: collectionMock };

vi.mock('../lib/firestore.js', () => ({
  getDb: () => dbMock,
}));

const fetchMock = vi.fn();
global.fetch = fetchMock;

beforeEach(() => {
  fetchMock.mockReset();
  setDocMock.mockReset();
  process.env.XENDIT_SECRET_KEY = 'sk_test_xxx';
  process.env.SUCCESS_REDIRECT_BASE = 'https://pcpga.org';
});

import { createInvoiceHandler } from '../createInvoice.js';

describe('createInvoiceHandler', () => {
  it('rejects amount <= 0', async () => {
    await expect(
      createInvoiceHandler({ data: { amount: 0, donorName: 'X' } }),
    ).rejects.toThrow(/amount/i);
  });

  it('creates Xendit invoice + writes PENDING doc, returns invoice_url', async () => {
    fetchMock.mockResolvedValue({
      ok: true,
      json: async () => ({ invoice_url: 'https://xendit/invoice/abc', id: 'xen-abc' }),
    });

    const result = await createInvoiceHandler({
      data: { amount: 500, donorName: 'Jane', donorEmail: 'jane@x.com' },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.xendit.co/v2/invoices',
      expect.objectContaining({ method: 'POST' }),
    );
    expect(setDocMock).toHaveBeenCalledWith(
      expect.objectContaining({
        amount: 500,
        donorName: 'Jane',
        donorEmail: 'jane@x.com',
        status: 'PENDING',
      }),
    );
    expect(result.invoice_url).toBe('https://xendit/invoice/abc');
  });

  it('throws when Xendit API returns non-ok', async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 400, json: async () => ({ message: 'bad' }) });
    await expect(
      createInvoiceHandler({ data: { amount: 100, donorName: 'X' } }),
    ).rejects.toThrow(/bad/);
  });
});
