import { describe, it, expect, vi, beforeEach } from 'vitest';
import crypto from 'node:crypto';

const updateDonationMock = vi.fn();
const setDonorMock = vi.fn();
const addAuditMock = vi.fn();

vi.mock('../lib/firestore.js', () => ({
  getDb: () => ({
    collection: (name) => ({
      doc: (id) => ({
        update: (...a) => updateDonationMock(name, id, ...a),
        set: (...a) => setDonorMock(name, id, ...a),
        // donation lookup carries donorName; existing donor has no createdAt yet
        get: () => Promise.resolve({ exists: true, data: () => ({ donorName: 'Jane Doe' }) }),
      }),
      add: (...a) => addAuditMock(name, ...a),
    }),
  }),
}));

vi.mock('firebase-admin/firestore', () => ({
  FieldValue: {
    serverTimestamp: () => 'TS',
    increment: (n) => ({ _inc: n }),
  },
}));

beforeEach(() => {
  updateDonationMock.mockReset();
  setDonorMock.mockReset();
  addAuditMock.mockReset();
  process.env.XENDIT_CALLBACK_TOKEN = 'correct-token';
});

import { handleWebhookRequest } from '../xenditWebhook.js';

function makeReq(headers, body) {
  return { method: 'POST', headers, body };
}
function makeRes() {
  const res = { statusCode: 200, body: null };
  res.status = (c) => { res.statusCode = c; return res; };
  res.send = (b) => { res.body = b; return res; };
  res.json = (b) => { res.body = b; return res; };
  return res;
}

describe('xenditWebhook', () => {
  it('rejects when token missing', async () => {
    const res = makeRes();
    await handleWebhookRequest(makeReq({}, {}), res);
    expect(res.statusCode).toBe(401);
  });

  it('rejects when token mismatched (constant-time)', async () => {
    const res = makeRes();
    await handleWebhookRequest(
      makeReq({ 'x-callback-token': 'wrong' }, { external_id: 'd-1', status: 'PAID' }),
      res,
    );
    expect(res.statusCode).toBe(401);
  });

  it('marks PAID and upserts donor on invoice.paid', async () => {
    const res = makeRes();
    await handleWebhookRequest(
      makeReq(
        { 'x-callback-token': 'correct-token' },
        { external_id: 'd-1', status: 'PAID', amount: 500, payer_email: 'jane@x.com', payment_method: 'CREDIT_CARD' },
      ),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(updateDonationMock).toHaveBeenCalledWith(
      'donations', 'd-1',
      expect.objectContaining({ status: 'PAID', method: 'CREDIT_CARD' }),
    );
    const expectedDonorId = crypto.createHash('sha256').update('jane@x.com').digest('hex');
    expect(setDonorMock).toHaveBeenCalledWith(
      'donors', expectedDonorId,
      expect.objectContaining({ name: 'Jane Doe', createdAt: 'TS', lastGiftAt: 'TS' }),
      { merge: true },
    );
  });

  it('marks EXPIRED on invoice.expired', async () => {
    const res = makeRes();
    await handleWebhookRequest(
      makeReq(
        { 'x-callback-token': 'correct-token' },
        { external_id: 'd-2', status: 'EXPIRED' },
      ),
      res,
    );
    expect(res.statusCode).toBe(200);
    expect(updateDonationMock).toHaveBeenCalledWith(
      'donations', 'd-2',
      expect.objectContaining({ status: 'EXPIRED' }),
    );
  });
});
