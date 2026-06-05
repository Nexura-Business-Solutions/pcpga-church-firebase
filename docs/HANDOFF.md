# PCPGA Church — Handoff Guide

## Adding a new admin

Admins sign in with **one-click Google** — there is no Firebase Auth user to
create. An admin is simply their Google email on the allowlist.

1. Sign in at https://pcpga-church-prod.web.app/login (as an **owner**).
2. Go to `/admin` → **Access Control** and add the person's **Google email**
   with a role (`admin` or `manager`).
   - (Equivalent: Firestore Console → `admins` collection → Add document with
     **Doc ID = their lowercased email**, field `role` = `"admin"`.)
3. The new admin opens `/login` and clicks **Continue with Google** using that
   same Google account. Done — no password, no manual user creation.

> The allowlist is keyed by **email** (doc id = lowercased email), not UID. A
> Google account that isn't on the allowlist is signed straight back out.

## Sign-in methods

- **Google (primary)** — one-click, for any allowlisted Google email.
- **Email + password (fallback)** — still available for legacy accounts; use
  **Forgot password?** on `/login` to reset. Firebase sends a reset email.

## Removing an admin

`/admin` → **Access Control** → remove them (or Firestore Console → `admins`
collection → delete the doc keyed by their email).

## Xendit webhook URL

Registered in Xendit dashboard → **Settings → Callbacks**. Current URL:

```
https://asia-southeast1-pcpga-church-prod.cloudfunctions.net/xenditWebhook
```

If the function is migrated to a different region, update Xendit dashboard to match.

## Where things live

| Thing | Location |
|---|---|
| Sermons | Firestore `sermons` |
| Library resources | Firestore `library` |
| Churches | Firestore `churches` |
| Site content (hero, donation page, etc.) | Firestore `settings` |
| Admin allowlist | Firestore `admins/{uid}` (UID must match a Firebase Auth user) |
| Donations | Firestore `donations` — written only by Cloud Functions |
| Donors (aggregated) | Firestore `donors` — written only by Cloud Functions |
| Audit trail | Firestore `audit` — append-only |
| Media (audio, images, files) | Firebase Storage `gs://pcpga-church-prod.appspot.com/` |

## Common admin tasks

| Task | Where |
|---|---|
| Edit homepage hero | `/admin/hero` |
| Add/edit sermons | `/admin/sermons` |
| Add/edit library resources | `/admin/library` |
| Add/edit churches | `/admin/churches` |
| View donations | `/admin/donations` |
| View donors | `/admin/donations/donors` |
| Site-wide settings (about, contact, announcements, presbyteries) | `/admin/content` |
