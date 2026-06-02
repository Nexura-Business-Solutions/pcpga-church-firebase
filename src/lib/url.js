// Returns the URL only when it is a safe external http(s) link, otherwise
// undefined. Use this whenever an admin-editable / Firestore-sourced URL is
// rendered into an href, to block `javascript:` and `data:` scheme injection
// (stored XSS). An undefined href renders an inert anchor rather than executing.
export function safeExternalHref(url) {
    return typeof url === 'string' && /^https?:\/\//i.test(url.trim()) ? url : undefined;
}
