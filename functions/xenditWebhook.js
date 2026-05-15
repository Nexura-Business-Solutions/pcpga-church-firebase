import { onRequest } from 'firebase-functions/v2/https';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'node:crypto';
import { getDb } from './lib/firestore.js';

function constantTimeEq(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export async function handleWebhookRequest(req, res) {
  const expected = process.env.XENDIT_CALLBACK_TOKEN;
  const got = req.headers['x-callback-token'];

  if (!expected || !got || !constantTimeEq(got, expected)) {
    return res.status(401).send('unauthorized');
  }

  const body = req.body || {};
  const externalId = body.external_id;
  if (!externalId) return res.status(400).send('missing external_id');

  const db = getDb();
  const status = body.status === 'PAID' ? 'PAID' : body.status === 'EXPIRED' ? 'EXPIRED' : 'PENDING';

  await db.collection('donations').doc(externalId).update({
    status,
    method: body.payment_method || null,
    paidAt: status === 'PAID' ? FieldValue.serverTimestamp() : null,
  });

  if (status === 'PAID' && body.payer_email) {
    const donorId = crypto.createHash('sha256').update(body.payer_email).digest('hex');
    await db.collection('donors').doc(donorId).set(
      {
        email: body.payer_email,
        totalGiven: FieldValue.increment(Number(body.amount) || 0),
        donationCount: FieldValue.increment(1),
        lastGiftAt: FieldValue.serverTimestamp(),
      },
      { merge: true },
    );
  }

  await db.collection('audit').add({
    uid: null,
    action: 'xendit_webhook',
    targetCollection: 'donations',
    targetId: externalId,
    before: null,
    after: { status, method: body.payment_method || null },
    at: FieldValue.serverTimestamp(),
  });

  return res.status(200).json({ ok: true });
}

export const xenditWebhook = onRequest(
  { region: 'asia-southeast1', secrets: ['XENDIT_CALLBACK_TOKEN'] },
  handleWebhookRequest,
);
