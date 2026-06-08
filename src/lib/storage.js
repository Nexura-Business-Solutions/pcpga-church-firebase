import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage, auth } from './firebase.js';

// If the resumable upload makes no progress for this long, fail loudly instead
// of hanging. The Firebase SDK otherwise retries silently for ~2 minutes on
// transient/permission errors, which looks like a frozen spinner to the user.
// This is a STALL timeout (reset on every progress tick), not a total cap — a
// large video on a slow connection is legitimately slow but still progressing.
const STALL_TIMEOUT_MS = 30000;

export async function uploadFile(path, file, onProgress) {
  // Force-refresh the ID token first so a newly-granted custom claim (admin:true)
  // is present WITHOUT the user having to sign out and back in. Storage rules
  // read the claim from the token, and the cached session token may predate the
  // grant. Best-effort: a refresh failure shouldn't block the upload attempt.
  try {
    await auth.currentUser?.getIdToken(true);
  } catch (e) {
    console.warn('[uploadFile] token refresh failed (continuing):', e?.code || e?.message);
  }

  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(ref(storage, path), file);
    let settled = false;
    let stallTimer = null;

    const clearStall = () => { if (stallTimer) { clearTimeout(stallTimer); stallTimer = null; } };
    const armStall = () => {
      clearStall();
      stallTimer = setTimeout(() => {
        if (settled) return;
        settled = true;
        try { task.cancel(); } catch { /* already finished */ }
        console.error('[uploadFile] stalled — no progress for', STALL_TIMEOUT_MS, 'ms · path:', path);
        reject(new Error('Upload stalled — no response. Sign out and back in to refresh your session, then try again (or check your connection).'));
      }, STALL_TIMEOUT_MS);
    };

    armStall();
    task.on(
      'state_changed',
      (snap) => {
        armStall(); // any progress resets the stall timer
        if (onProgress && snap.totalBytes) {
          onProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        }
      },
      (err) => {
        if (settled) return;
        settled = true;
        clearStall();
        // Surface the real reason — code is the actionable bit (e.g.
        // storage/unauthorized = rules/claim, storage/retry-limit-exceeded).
        console.error('[uploadFile] failed · code:', err?.code, '· message:', err?.message, '· serverResponse:', err?.serverResponse);
        reject(err);
      },
      async () => {
        if (settled) return;
        settled = true;
        clearStall();
        try {
          resolve(await getDownloadURL(task.snapshot.ref));
        } catch (e) {
          console.error('[uploadFile] getDownloadURL failed:', e?.code, e?.message);
          reject(e);
        }
      },
    );
  });
}
