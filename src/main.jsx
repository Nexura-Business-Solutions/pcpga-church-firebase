import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

// Lock viewport at scale 1.0 — iOS Safari ignores user-scalable=no in the
// viewport meta, so we belt-and-suspenders the zoom kill at the event level.
const stop = (e) => { e.preventDefault(); };
document.addEventListener('gesturestart', stop, { passive: false });
document.addEventListener('gesturechange', stop, { passive: false });
document.addEventListener('gestureend', stop, { passive: false });
document.addEventListener('dblclick', stop, { passive: false });
document.addEventListener('wheel', (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
document.addEventListener('keydown', (e) => {
  if ((e.ctrlKey || e.metaKey) && ['=', '-', '+', '0'].includes(e.key)) e.preventDefault();
}, { passive: false });

// Block multi-touch (pinch) and lock horizontal drift on iOS Safari, which
// otherwise lets the page rubber-band left/right even with overflow-x: hidden.
document.addEventListener('touchmove', (e) => {
  if (e.touches && e.touches.length > 1) e.preventDefault();
}, { passive: false });
// Kill any residual horizontal scroll on the document
window.addEventListener('scroll', () => {
  if (window.scrollX !== 0) window.scrollTo(0, window.scrollY);
}, { passive: true });
// If a double-tap or multi-touch still slips through, snap any visual viewport
// drift back to scale 1 on each interaction end.
const snapBack = () => {
  if (window.visualViewport && Math.abs(window.visualViewport.scale - 1) > 0.001) {
    const meta = document.querySelector('meta[name="viewport"]');
    if (meta) {
      const orig = meta.getAttribute('content');
      meta.setAttribute('content', orig + ', reset=1');
      requestAnimationFrame(() => meta.setAttribute('content', orig));
    }
  }
};
window.visualViewport?.addEventListener('resize', snapBack);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
        <Toaster position="top-right" />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
);
