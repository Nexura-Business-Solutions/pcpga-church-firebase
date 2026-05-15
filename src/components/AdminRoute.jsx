import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

export default function AdminRoute({ children }) {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading…</div>;
  }
  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}
