import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getDb } from './lib/firestore.js';

export async function createInvoiceHandler(request) {
  const { amount, donorName, donorEmail } = request.data || {};

  if (!amount || amount <= 0) {
    throw new HttpsError('invalid-argument', 'amount must be > 0');
  }

  // .trim() guards against a stray trailing newline in the stored secret —
  // that corrupts the Basic-auth header and makes Xendit return 401.
  const secret = process.env.XENDIT_SECRET_KEY?.trim();
  if (!secret) throw new HttpsError('failed-precondition', 'XENDIT_SECRET_KEY missing');

  const externalId = `donation-${Date.now()}`;
  const successBase = process.env.SUCCESS_REDIRECT_BASE || 'https://pcpga-church-prod.web.app';

  const res = await fetch('https://api.xendit.co/v2/invoices', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${Buffer.from(secret + ':').toString('base64')}`,
    },
    body: JSON.stringify({
      external_id: externalId,
      amount,
      payer_email: donorEmail || 'donations@pcpga.org',
      description: 'PCP General Donation',
      currency: 'PHP',
      success_redirect_url: `${successBase}/donation/success?ref=${externalId}&amount=${amount}&name=${encodeURIComponent(donorName || 'Anonymous')}`,
      failure_redirect_url: `${successBase}/#donate`,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new HttpsError('internal', data.message || 'Xendit error');

  await getDb().collection('donations').doc(externalId).set({
    amount,
    currency: 'PHP',
    donorName: donorName || 'Anonymous',
    donorEmail: donorEmail || null,
    externalId,
    xenditInvoiceId: data.id,
    status: 'PENDING',
    method: null,
    createdAt: new Date(),
    paidAt: null,
  });

  return { invoice_url: data.invoice_url };
}

export const createInvoice = onCall(
  { region: 'asia-southeast1', secrets: ['XENDIT_SECRET_KEY'] },
  createInvoiceHandler,
);
