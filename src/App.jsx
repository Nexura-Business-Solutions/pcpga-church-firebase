import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminRoute from './components/AdminRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import ChurchesPage from './pages/ChurchesPage.jsx';
import SeminariesPage from './pages/SeminariesPage.jsx';
import DonationPage from './pages/DonationPage.jsx';
import DonationSuccessPage from './pages/DonationSuccessPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import NotFoundPage from './pages/NotFoundPage.jsx';

const AdminDashboard = lazy(() => import('./admin/AdminDashboard.jsx'));
const AdminHero = lazy(() => import('./admin/AdminHero.jsx'));
const AdminSermons = lazy(() => import('./admin/AdminSermons.jsx'));
const AdminLibrary = lazy(() => import('./admin/AdminLibrary.jsx'));
const AdminChurches = lazy(() => import('./admin/AdminChurches.jsx'));
const AdminDonations = lazy(() => import('./admin/AdminDonations.jsx'));
const AdminDonors = lazy(() => import('./admin/AdminDonors.jsx'));
const AdminContent = lazy(() => import('./admin/AdminContent.jsx'));
const AdminAdmins = lazy(() => import('./admin/AdminAdmins.jsx'));

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
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/churches" element={<ChurchesPage />} />
      <Route path="/seminaries" element={<SeminariesPage />} />
      <Route path="/donation" element={<DonationPage />} />
      <Route path="/donation/success" element={<DonationSuccessPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin" element={adminRoute(AdminDashboard)} />
      <Route path="/admin/hero" element={adminRoute(AdminHero)} />
      <Route path="/admin/sermons" element={adminRoute(AdminSermons)} />
      <Route path="/admin/library" element={adminRoute(AdminLibrary)} />
      <Route path="/admin/churches" element={adminRoute(AdminChurches)} />
      <Route path="/admin/donations" element={adminRoute(AdminDonations)} />
      <Route path="/admin/donations/donors" element={adminRoute(AdminDonors)} />
      <Route path="/admin/content" element={adminRoute(AdminContent)} />
      <Route path="/admin/admins" element={adminRoute(AdminAdmins, { ownerOnly: true })} />

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
