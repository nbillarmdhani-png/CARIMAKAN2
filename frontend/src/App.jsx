import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { Toaster } from 'react-hot-toast';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import { OrderProvider } from './context/OrderContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RatingProvider } from './context/RatingContext';
import { VoucherProvider } from './context/VoucherContext'; // ← TAMBAHKAN INI
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import FoodDetail from './pages/FoodDetail';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Chat from './pages/Chat';
import Voucher from './pages/Voucher';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import AdminRoute from './components/AdminRoute';

const AppRoutes = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* ===== PUBLIC ROUTES ===== */}
        <Route path="/login" element={<PageTransition><Login /></PageTransition>} />
        
        {/* ===== HOME ===== */}
        <Route 
          path="/" 
          element={
            user ? <PageTransition><Home /></PageTransition> : <Navigate to="/login" replace />
          } 
        />
        
        {/* ===== FOOD DETAIL ===== */}
        <Route 
          path="/meal/:id" 
          element={
            user ? <PageTransition><FoodDetail /></PageTransition> : <Navigate to="/login" replace />
          } 
        />
        
        {/* ===== PROTECTED ROUTES ===== */}
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <PageTransition><Profile /></PageTransition>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/wishlist" 
          element={
            <ProtectedRoute>
              <PageTransition><Wishlist /></PageTransition>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/orders" 
          element={
            <ProtectedRoute>
              <PageTransition><Orders /></PageTransition>
            </ProtectedRoute>
          } 
        />
        
        {/* ===== CHAT ROUTE ===== */}
        <Route 
          path="/chat" 
          element={
            <ProtectedRoute>
              <PageTransition><Chat /></PageTransition>
            </ProtectedRoute>
          } 
        />
        
        {/* ===== VOUCHER ROUTE ===== */}
        <Route 
          path="/voucher" 
          element={
            <ProtectedRoute>
              <PageTransition><Voucher /></PageTransition>
            </ProtectedRoute>
          } 
        />
        
        {/* ===== ADMIN ROUTE ===== */}
        <Route 
          path="/admin" 
          element={
            <AdminRoute>
              <PageTransition><AdminDashboard /></PageTransition>
            </AdminRoute>
          } 
        />
        
        {/* ===== 404 ===== */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <CartProvider>
            <WishlistProvider>
              <OrderProvider>
                <RatingProvider>
                  <VoucherProvider>  {/* ← TAMBAHKAN DI SINI */}
                    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
                      <Navbar />
                      <main className="flex-1 container mx-auto px-4 py-8">
                        <AppRoutes />
                      </main>
                      <Footer />
                    </div>
                    <Toaster
                      position="top-right"
                      reverseOrder={false}
                      toastOptions={{
                        duration: 3000,
                        style: {
                          borderRadius: '12px',
                          padding: '14px 18px',
                          fontSize: '14px',
                          maxWidth: '420px',
                        },
                        success: {
                          style: {
                            background: '#10B981',
                            color: '#fff',
                          },
                          iconTheme: {
                            primary: '#fff',
                            secondary: '#10B981',
                          },
                        },
                        error: {
                          style: {
                            background: '#EF4444',
                            color: '#fff',
                          },
                          iconTheme: {
                            primary: '#fff',
                            secondary: '#EF4444',
                          },
                        },
                        loading: {
                          style: {
                            background: '#3B82F6',
                            color: '#fff',
                          },
                        },
                      }}
                    />
                  </VoucherProvider>  {/* ← TUTUP DI SINI */}
                </RatingProvider>
              </OrderProvider>
            </WishlistProvider>
          </CartProvider>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;