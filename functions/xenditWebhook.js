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
  // .trim() guards against a stray trailing newline in the stored secret that
  // would make every callback token mismatch → all webhooks rejected as 401.
  const expected = process.env.XENDIT_CALLBACK_TOKEN?.trim();
  const got = (req.headers['x-callback-token'] || '').trim();

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
    const donorRef = db.collection('donors').doc(donorId);
    // Carry the donor's name from the original donation, and ensure `createdAt`
    // exists — the admin Donors list queries orderBy('createdAt'), which silently
    // drops any donor doc missing that field (so they'd never show up).
    const donationSnap = await db.collection('donations').doc(externalId).get();
    const donorName = donationSnap.exists ? donationSnap.data().donorName || null : null;
    const existingDonor = await donorRef.get();
    const donorPatch = {
      email: body.payer_email,
      totalGiven: FieldValue.increment(Number(body.amount) || 0),
      donationCount: FieldValue.increment(1),
      lastGiftAt: FieldValue.serverTimestamp(),
    };
    if (donorName) donorPatch.name = donorName;
    if (!existingDonor.exists || !existingDonor.data().createdAt) donorPatch.createdAt = FieldValue.serverTimestamp();
    await donorRef.set(
      donorPatch,
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
