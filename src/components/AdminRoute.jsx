import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth.js';

export default function AdminRoute({ children, ownerOnly = false }) {
  const { user, isAdmin, isOwner, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: 'hsl(42 76% 95%)' }}>
        <div className="animate-spin w-7 h-7 border-2 border-[#8b1f24] border-t-transparent rounded-full" />
      </div>
    );
  }
  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  if (ownerOnly && !isOwner) {
    return <Navigate to="/admin" replace />;
  }
  return children;
}
