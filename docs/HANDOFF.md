# PCPGA Church — Handoff Guide

## Adding a new admin

1. Firebase Console → Authentication → Users → **Add user**
2. Enter their email + a temporary password
3. Copy their UID (shown after the user is created)
4. Firestore Console → `admins` collection → **Add document**
   - Doc ID: paste the UID
   - Fields:
     - `email` (string) — their email
     - `role` (string) — e.g. `"editor"` or `"owner"`
     - `addedAt` (timestamp) — set to current time
5. Email the new admin their temporary password and ask them to log in at https://pcpga-church-prod.web.app/login, then click **Forgot password?** to set their own.

## Password reset

Anyone with an existing admin account can click **Forgot password?** on `/login`. Firebase sends a reset email automatically.

## Removing an admin

Firestore Console → `admins` collection → delete their document. Optionally also disable their auth user in **Authentication → Users**.

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
