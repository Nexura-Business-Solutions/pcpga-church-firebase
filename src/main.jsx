import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import './index.css';

// Note: we intentionally do NOT disable pinch-zoom or snap the viewport back to
// scale 1. Blocking zoom fails WCAG 1.4.4 (Resize Text) and was only ever a
// band-aid for horizontal overflow. Overflow is now contained at the source
// (no 100vw widths, fluid grids that wrap) plus the `overflow-x: clip` safety
// net on <body>, so the page stays put while users keep the ability to zoom.

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
