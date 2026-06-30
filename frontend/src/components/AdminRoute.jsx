import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const AdminRoute = ({ children }) => {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🚫</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Akses Ditolak</h2>
        <p className="text-gray-500 dark:text-gray-400 max-w-md">
          Maaf, halaman ini hanya dapat diakses oleh <span className="font-semibold text-pink-500">Admin</span>.
          Anda tidak memiliki izin untuk mengakses halaman ini.
        </p>
        <button
          onClick={() => window.location.href = '/'}
          className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
        >
          Kembali ke Beranda
        </button>
      </div>
    );
  }

  return children;
};

export default AdminRoute;