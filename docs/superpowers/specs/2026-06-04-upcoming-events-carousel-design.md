# Upcoming Events Carousel + Portrait Announcement Popup

**Date:** 2026-06-04
**Status:** Approved

## Problem

The site owner cannot upload announcements via the admin console. There are 2 upcoming
denominational events (3 poster graphics) that need to go live. The existing announcement
system supports only ONE site-wide popup with a single image, and the "Upcoming events"
homepage section is a static empty placeholder.

## Goal

- A rotating **Upcoming Events carousel** in the existing `events` section showing all 3
  posters (auto-advance, manual controls, click-to-enlarge).
- A **portrait announcement popup** (once per visitor) featuring the main poster.
- Seed the data now via the admin service-account script (no admin-console dependency).

## Events / source images

| Order | Event | Date | Venue | Image (Storage) | Aspect |
|-------|-------|------|-------|-----------------|--------|
| 1 | 60th Stated Meeting of the Visayas Presbytery | June 9, 2026 | Cogon Cruz Presbyterian Church, Danao City, Cebu | 1b3c7fc4… | landscape |
| 2 | 59th Stated Meeting of the Southern Visayas Presbytery & 39th PCP Anniversary | June 12, 2026 | Dumaguete Mission Church, Dumaguete City | b01c5783… (portrait poster) | portrait |
| 3 | (same event, alt banner) | June 12, 2026 | Dumaguete City | b5d22d42… (teal banner) | landscape |

Popup uses image #2 (portrait).

## Data model

- `settings/upcoming-events` → `{ value: [ { id, title, date, venue, imageUrl, link } ] }`
  (mirrors the existing array-in-settings pattern used by `presbyteries`, `committees`).
- `settings/announcement` → `{ value: { isActive:true, type:'event', title, message,
  mediaUrl, mediaType:'image', buttonText:'View upcoming events', buttonLink:'#events' } }`.

Images uploaded to Firebase Storage under `content/events/<ts>-<name>.jpg` with a
`firebaseStorageDownloadTokens` token (same approach as `upload_library.mjs`).

## Frontend

- **`src/components/EventsCarousel.jsx`** — loads `getSettings('upcoming-events')`.
  - Auto-advances every 6s; pauses on hover/focus. Prev/next arrows + dot indicators.
  - Each slide: image rendered with `object-fit: contain` inside a uniform 4:3-ish frame
    over a soft background so portrait & landscape posters both show uncropped.
  - Slide caption: title + date chip + venue. Click image → lightbox (full image).
  - Respects `prefers-reduced-motion` (no autoplay).
  - Renders nothing if the events array is empty (graceful).
- **`HomePage.jsx`** — add `'upcoming-events'` to the settings keys fetched (line ~200);
  replace the `events__empty` placeholder with `<EventsCarousel events={...} />`,
  falling back to the existing empty message when there are no events. Add `id="events"`
  to the section so the popup button can scroll to it.
- **`AnnouncementModal.jsx`** — no logic change; it already renders `mediaUrl` image +
  button. (Portrait image is supported by the existing `announce__media`.)
- **`index.css`** — add `.events__carousel`, slide/frame, controls, dots, and `.events__lightbox`
  classes matching the existing editorial design language (CSS vars, kicker, reveal).

## Out of scope (follow-up)

- Admin-console CRUD for upcoming events (seeded via script for now).
- Video slides (images only).

## Verification

- `npm run build` succeeds; `npm run lint` clean for touched files.
- Local `npm run preview`: carousel rotates through 3 posters, controls work, lightbox
  opens, portrait popup appears once and its button scrolls to the events section.
- Deploy to live `pcpga-church-prod` hosting ONLY after explicit owner approval.
