# PCPGA Church — Architecture

## Stack

- **Frontend:** Vite + React 18 + React Router 6 + Tailwind 3
- **Auth:** Firebase Auth (email/password)
- **Database:** Firestore (asia-southeast1)
- **Storage:** Firebase Storage (asia-southeast1)
- **Server code:** 2 Cloud Functions (Node 20, asia-southeast1)
- **Hosting:** Firebase Hosting
- **Payments:** Xendit

## Firestore collections

| Collection | Purpose | Writable by |
|---|---|---|
| `sermons` | Sermon list + audio/thumbnail URLs | Admins |
| `library` | Library items (bulletins, newsletters, forms, etc.) | Admins |
| `churches` | Church locations | Admins |
| `settings` | Site-wide settings (hero, about, contact, announcement, presbyteries) | Admins |
| `admins` | Allowlist for admin access — doc ID is the Firebase Auth UID | Manually via console |
| `donations` | Donation records | Cloud Functions only |
| `donors` | Aggregated donor info | Cloud Functions only |
| `audit` | Append-only audit trail | Admins + Functions |

## Cloud Functions

- **`createInvoice`** — HTTPS callable; creates a Xendit invoice and writes a `PENDING` donation document
- **`xenditWebhook`** — HTTPS endpoint; receives Xendit callbacks, verifies `x-callback-token`, marks the donation `PAID`, upserts the donor

Both run in `asia-southeast1`.

## Function secrets

Set via `firebase functions:secrets:set`:

- `XENDIT_SECRET_KEY` — used by `createInvoice` to call the Xendit API
- `XENDIT_CALLBACK_TOKEN` — used by `xenditWebhook` to verify incoming callback authenticity

The functions deploy will refuse to start until both secrets are set.

## Frontend lib wrappers (`src/lib/`)

- `firebase.js` — Firebase init (hardcoded config — no env vars; the config is public-facing anyway and avoids CI secret setup)
- `auth.js` — `loginWithEmail`, `logout`, `sendReset`, `useAuth()` hook with admin-allowlist lookup
- `firestore.js` — typed collection accessors (`listSermons`, `createSermon`, `updateSermon`, etc.)
- `storage.js` — `uploadFile(path, file, onProgress)` returning the download URL
- `store.js` — façade combining firestore + storage helpers with sensible defaults; used by pages and admin panels
- `seed-data.js` — static fallback lists (`regions`, `defaultPresbyteries`) used only when the corresponding Firestore doc is empty

## Routing

`src/App.jsx` defines routes:

- **Public:** `/`, `/library`, `/churches`, `/donation`, `/donation/success`, `/login`
- **Admin (gated by `AdminRoute`):** `/admin`, `/admin/hero`, `/admin/sermons`, `/admin/library`, `/admin/churches`, `/admin/donations`, `/admin/donations/donors`, `/admin/content`

Admin pages are lazy-loaded via `React.lazy()` so public visitors don't download the admin bundle.

## Security rules

- **Firestore** (`firestore.rules`): public reads on display collections (`sermons`, `library`, `churches`, `settings`); writes require an admin doc at `admins/{uid}`. `donations` and `donors` are write-locked to functions.
- **Storage** (`storage.rules`): public reads on media; writes require admin auth.

## Deploy account

`slowdee59@gmail.com` (Nexura Business Solutions). On client handover, this is replaced by the client's own Firebase Owner account.
