import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import AdminRoute from './components/AdminRoute.jsx';
import ChatbotWidget from './components/ChatbotWidget.jsx';
import HomePage from './pages/HomePage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import ChurchesPage from './pages/ChurchesPage.jsx';
import SeminariesPage from './pages/SeminariesPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import DonationPage from './pages/DonationPage.jsx';
import DonationSuccessPage from './pages/DonationSuccessPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

// Lazy chunks are hashed per build. When a new version is deployed, a tab that
// still runs the old bundle (or hits a transient mobile network blip) can fail
// to import a route chunk — surfacing as "Failed to fetch dynamically imported
// module". Self-heal: retry once, then force ONE full reload so the no-cache
// index.html pulls the fresh chunk URLs. A timestamp guard prevents a reload loop.
function lazyWithRetry(factory) {
  return lazy(() =>
    factory().catch((err) =>
      new Promise((resolve, reject) => {
        setTimeout(() => {
          factory().then(resolve).catch(() => {
            const TS = 'pcp_chunk_reload_ts';
            const last = Number(sessionStorage.getItem(TS) || 0);
            if (Date.now() - last > 10000) {
              sessionStorage.setItem(TS, String(Date.now()));
              window.location.reload();
            } else {
              reject(err);
            }
          });
        }, 800);
      }),
    ),
  );
}

const AdminDashboard = lazyWithRetry(() => import('./admin/AdminDashboard.jsx'));
const AdminHero = lazyWithRetry(() => import('./admin/AdminHero.jsx'));
const AdminSermons = lazyWithRetry(() => import('./admin/AdminSermons.jsx'));
const AdminLibrary = lazyWithRetry(() => import('./admin/AdminLibrary.jsx'));
const AdminChurches = lazyWithRetry(() => import('./admin/AdminChurches.jsx'));
const AdminDonations = lazyWithRetry(() => import('./admin/AdminDonations.jsx'));
const AdminDonors = lazyWithRetry(() => import('./admin/AdminDonors.jsx'));
const AdminContent = lazyWithRetry(() => import('./admin/AdminContent.jsx'));
const AdminAdmins = lazyWithRetry(() => import('./admin/AdminAdmins.jsx'));
const AdminSeminaries = lazyWithRetry(() => import('./admin/AdminSeminaries.jsx'));

function AdminFallback() {
  return (
    <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--ink-mute, #888)' }}>
      Loading…
    </div>
  );
}

function adminRoute(Component, { ownerOnly = false } = {}) {
  return (
    <AdminRoute ownerOnly={ownerOnly}>
      <Suspense fallback={<AdminFallback />}>
        <Component />
      </Suspense>
    </AdminRoute>
  );
}

export default function App() {
  // Keep the third-party chat script OFF privileged routes (admin/login) — those
  // pages render donor / admin PII. Load the widget on public pages only.
  const { pathname } = useLocation();
  const showChat = !pathname.startsWith('/admin') && pathname !== '/login';
  return (
    <>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/churches" element={<ChurchesPage />} />
      <Route path="/seminaries" element={<SeminariesPage />} />
      <Route path="/history" element={<HistoryPage />} />
      <Route path="/donation" element={<DonationPage />} />
      <Route path="/donation/success" element={<DonationSuccessPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin" element={adminRoute(AdminDashboard)} />
      <Route path="/admin/hero" element={adminRoute(AdminHero)} />
      <Route path="/admin/sermons" element={adminRoute(AdminSermons)} />
      <Route path="/admin/library" element={adminRoute(AdminLibrary)} />
      <Route path="/admin/churches" element={adminRoute(AdminChurches)} />
      <Route path="/admin/seminaries" element={adminRoute(AdminSeminaries)} />
      <Route path="/admin/donations" element={adminRoute(AdminDonations)} />
      <Route path="/admin/donations/donors" element={adminRoute(AdminDonors)} />
      <Route path="/admin/content" element={adminRoute(AdminContent)} />
      <Route path="/admin/admins" element={adminRoute(AdminAdmins, { ownerOnly: true })} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    {/* Botpress support chat — public pages only, never on admin/login */}
    {showChat && <ChatbotWidget />}
    </>
  );
}
