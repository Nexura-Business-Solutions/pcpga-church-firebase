#!/usr/bin/env node
// One-time backfill: grant admin:true to every existing admins/{email} that has
// an Auth user but no claim yet. Run this once after deploying the auto-grant
// triggers — admins added BEFORE the triggers existed won't have the claim, and
// nothing re-writes their doc to fire the trigger.
//
// Usage (run from the functions/ dir so firebase-admin resolves):
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json \
//     node scripts/backfill-admin-claims.js            # dry run — reports only
//   GOOGLE_APPLICATION_CREDENTIALS=/path/to/sa.json \
//     node scripts/backfill-admin-claims.js --apply    # actually set claims
//
// The deploy account (slowdee59@gmail.com) can mint a service-account key for
// pcpga-church-prod, or set GOOGLE_APPLICATION_CREDENTIALS to one you already
// have. Project: pcpga-church-prod (asia-southeast1).
import { initializeApp, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAdminAuth, grantAdminClaim } from '../lib/adminClaims.js';

const APPLY = process.argv.includes('--apply');

if (!getApps().some((app) => app.name === '[DEFAULT]')) {
  initializeApp({ credential: applicationDefault() });
}
const db = getFirestore();
const auth = getAdminAuth();

const snap = await db.collection('admins').get();
console.log(`admins/: ${snap.size} doc(s) · mode: ${APPLY ? 'APPLY' : 'DRY RUN'}\n`);

const tally = { granted: 0, alreadyAdmin: 0, pending: 0, error: 0 };

for (const doc of snap.docs) {
  const email = doc.id;
  try {
    if (!APPLY) {
      // Dry run: inspect without mutating.
      let user;
      try {
        user = await auth.getUserByEmail(email);
      } catch (err) {
        if (err?.code === 'auth/user-not-found') {
          tally.pending += 1;
          console.log(`  PENDING  ${email}  (no Auth user — will grant at first sign-in)`);
          continue;
        }
        throw err;
      }
      if (user.customClaims?.admin === true) {
        tally.alreadyAdmin += 1;
        console.log(`  OK       ${email}  (already admin)`);
      } else {
        tally.granted += 1;
        console.log(`  WOULD-GRANT  ${email}  (uid ${user.uid})`);
      }
      continue;
    }

    const res = await grantAdminClaim(email, auth);
    if (res.status === 'granted') {
      tally.granted += 1;
      console.log(`  GRANTED  ${email}  (uid ${res.uid})`);
    } else if (res.status === 'noop') {
      tally.alreadyAdmin += 1;
      console.log(`  OK       ${email}  (already admin)`);
    } else if (res.status === 'pending') {
      tally.pending += 1;
      console.log(`  PENDING  ${email}  (no Auth user — will grant at first sign-in)`);
    }
  } catch (err) {
    tally.error += 1;
    console.error(`  ERROR    ${email}  ${err?.code || err?.message}`);
  }
}

console.log(
  `\nDone. granted=${tally.granted} alreadyAdmin=${tally.alreadyAdmin} ` +
    `pending=${tally.pending} error=${tally.error}`,
);
if (!APPLY) console.log('Dry run — re-run with --apply to set claims.');
process.exit(tally.error > 0 ? 1 : 0);
