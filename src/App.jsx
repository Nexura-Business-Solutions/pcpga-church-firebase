import { Routes, Route } from 'react-router-dom';
import AdminRoute from './components/AdminRoute.jsx';
import HomePage from './pages/HomePage.jsx';
import LibraryPage from './pages/LibraryPage.jsx';
import ChurchesPage from './pages/ChurchesPage.jsx';
import DonationPage from './pages/DonationPage.jsx';
import DonationSuccessPage from './pages/DonationSuccessPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import AdminDashboard from './admin/AdminDashboard.jsx';
import AdminHero from './admin/AdminHero.jsx';
import AdminSermons from './admin/AdminSermons.jsx';
import AdminLibrary from './admin/AdminLibrary.jsx';
import AdminChurches from './admin/AdminChurches.jsx';
import AdminDonations from './admin/AdminDonations.jsx';
import AdminDonors from './admin/AdminDonors.jsx';
import AdminContent from './admin/AdminContent.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/library" element={<LibraryPage />} />
      <Route path="/churches" element={<ChurchesPage />} />
      <Route path="/donation" element={<DonationPage />} />
      <Route path="/donation/success" element={<DonationSuccessPage />} />
      <Route path="/login" element={<LoginPage />} />

      <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
      <Route path="/admin/hero" element={<AdminRoute><AdminHero /></AdminRoute>} />
      <Route path="/admin/sermons" element={<AdminRoute><AdminSermons /></AdminRoute>} />
      <Route path="/admin/library" element={<AdminRoute><AdminLibrary /></AdminRoute>} />
      <Route path="/admin/churches" element={<AdminRoute><AdminChurches /></AdminRoute>} />
      <Route path="/admin/donations" element={<AdminRoute><AdminDonations /></AdminRoute>} />
      <Route path="/admin/donations/donors" element={<AdminRoute><AdminDonors /></AdminRoute>} />
      <Route path="/admin/content" element={<AdminRoute><AdminContent /></AdminRoute>} />
    </Routes>
  );
}
