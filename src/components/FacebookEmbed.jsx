import { useEffect, useRef, useState } from 'react';

// One embedded Facebook post, rendered via Facebook's iframe plugin
// (plugins/post.php). Facebook renders the iframe server-side, so the post —
// photos and text — shows inline even when an ad-blocker or privacy setting
// blocks the JS SDK (which would otherwise leave only a fallback link). No app
// token is needed for PUBLIC posts. Shared by Recent Events and Editor's Corner.

function isVideoUrl(url) {
    return /\/(videos?|reel)\//i.test(url) || /\/watch\/?\?/i.test(url) || /fb\.watch/i.test(url);
}

// FB bakes the width into the iframe URL, so we request a width that matches the
// container; height is a generous estimate (FB letterboxes shorter posts).
function buildSrc(url, width) {
    const enc = encodeURIComponent(url);
    const video = isVideoUrl(url);
    const base = video
        ? 'https://www.facebook.com/plugins/video.php'
        : 'https://www.facebook.com/plugins/post.php';
    const w = Math.round(width);
    const h = video ? Math.round(w * 0.62) + 130 : w + 360;
    return `${base}?href=${enc}&show_text=true&width=${w}&height=${h}`;
}

export default function FacebookEmbed({ url }) {
    const wrapRef = useRef(null);
    const [width, setWidth] = useState(500);
    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return undefined;
        const measure = () => setWidth(Math.max(280, Math.min(500, el.clientWidth)));
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const height = isVideoUrl(url) ? Math.round(width * 0.62) + 130 : width + 360;
    return (
        <div className="fbembed" ref={wrapRef}>
            <iframe
                title="Facebook post"
                src={buildSrc(url, width)}
                width={width}
                height={height}
                className="fbembed__frame"
                style={{ border: 'none', overflow: 'hidden' }}
                scrolling="no"
                frameBorder="0"
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
                loading="lazy"
            />
            <a className="fbembed__link" href={url} target="_blank" rel="noopener noreferrer">
                Open on Facebook ↗
            </a>
        </div>
    );
}
