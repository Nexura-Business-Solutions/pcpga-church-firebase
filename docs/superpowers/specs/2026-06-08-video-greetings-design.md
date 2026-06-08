# Video Greetings — landing carousel (design)

**Date:** 2026-06-08 · **Status:** approved by Boss D ("go build na")

## Goal
A new **"Video Greetings"** section on the public landing page, **immediately after the Hero**, separate from the existing Sermons section. Shows a **carousel** of multiple short greeting videos. Admin can **upload** an MP4 (or paste a YouTube/Facebook link) per slide.

## Requirements (from Boss D)
- Placement: directly **after the hero** section.
- **Uploadable** video (MP4 → Firebase Storage) with drag-and-drop + phone support (dodges the Windows file-picker hang).
- **Limit** the videos: ~50 MB per clip, up to ~6 in the carousel.
- **Carousel** (like Events/Welcome): arrows + dots; auto-advance pauses while a video is playing.
- Separate from Sermons.

## Data
`settings/video-greetings` = array (new arrayKey in store.js) of:
`{ id, videoUrl, posterUrl?, title?, caption? }`
- `videoUrl`: a YouTube/youtu.be URL → embedded iframe; otherwise a direct (Storage MP4) URL → `<video controls>`. Auto-detected via the existing `toEmbedUrl()` helper (no explicit type field needed).
- `posterUrl`: optional image shown before play (uploaded MP4 case).

## Components
- **`src/components/VideoCarousel.jsx`** (new) — modeled on `EventsCarousel.jsx`. Slides render either a YouTube `<iframe>` or a `<video controls poster>`. Arrows + dots, keyboard nav, reduced-motion aware. Auto-advance is disabled whenever a slide is actively playing. Filters out entries without a `videoUrl`.
- **`HomePage.jsx`** — fetch `video-greetings`; render `<section className="vidgreet">` with `<VideoCarousel/>` between the hero and the events section. Empty array → render nothing (no empty section).
- **`AdminContent.jsx`** — new "Video Greetings" tab: add/list/delete/reorder; per row: upload MP4 (Storage `content/videos/*`, ≤50 MB, image/video validation; drag-drop) OR a link field, + title + caption. Enforce max ~6 rows (hide "Add" past the cap). Saved in the existing `handleSave` Promise.all via `saveSettings('video-greetings', ...)`.
- **`landing-v3.css`** — `.vidcar*` + `.vidgreet*` styles, **scoped under `body.lp-v3`** (to beat the `body.lp-v3 *|button` resets), mirroring `.evcar`.

## Security
- Admin link is rendered only via the YouTube-embed allowlist (`toEmbedUrl`) or a direct `<video src>`; a non-YouTube, non-video link falls back to a sanitized external "Watch" button (`safeExternalHref`). No raw HTML / no `dangerouslySetInnerHTML`.
- Upload validated (video/* or image for poster, ≤50 MB), filename sanitized, Storage path `content/videos/*` (rules: `content/**` write = admin claim).

## Out of scope (v1)
Facebook native embed (FB link falls back to a "Watch on Facebook" button); per-video analytics; autoplay-with-sound.
