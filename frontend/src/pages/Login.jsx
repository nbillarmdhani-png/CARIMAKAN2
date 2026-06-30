import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaEnvelope, FaLock, FaUser, FaEye, FaEyeSlash, FaUtensils } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login, register, user } = useAuth();
  const navigate = useNavigate();

  // Buat akun default jika belum ada
  useEffect(() => {
    const createDefaultUsers = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/users');
        if (response.ok) {
          const users = await response.json();
          if (users.length === 0) {
            await fetch('http://localhost:5000/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: 'admin-001',
                name: 'Admin',
                email: 'admin@cari.com',
                password: 'admin123',
                role: 'admin'
              })
            });
            await fetch('http://localhost:5000/api/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                id: 'demo-001',
                name: 'Demo User',
                email: 'demo@email.com',
                password: 'password123',
                role: 'user'
              })
            });
            console.log('✅ Default users created in database');
          }
        }
      } catch (error) {
        console.log('⚠️ Using localStorage fallback');
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        
        const adminExists = users.find(u => u.role === 'admin');
        if (!adminExists) {
          users.push({
            id: 'admin-001',
            name: 'Admin',
            email: 'admin@cari.com',
            password: 'admin123',
            role: 'admin',
            createdAt: new Date().toISOString()
          });
        }
        
        const demoExists = users.find(u => u.email === 'demo@email.com');
        if (!demoExists) {
          users.push({
            id: 'demo-001',
            name: 'Demo User',
            email: 'demo@email.com',
            password: 'password123',
            role: 'user',
            createdAt: new Date().toISOString()
          });
        }
        
        localStorage.setItem('users', JSON.stringify(users));
        console.log('✅ Default users created in localStorage');
      }
    };
    
    createDefaultUsers();

    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        toast.success('🎉 Selamat datang kembali!', {
          duration: 2000,
          icon: '👋',
        });
        navigate('/');
      } else {
        if (!name.trim()) {
          throw new Error('Nama lengkap wajib diisi!');
        }
        await register(name, email, password);
        toast.success('🎉 Akun berhasil dibuat! Selamat bergabung!', {
          duration: 3000,
          icon: '✨',
        });
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
      toast.error(`❌ ${err.message}`, {
        duration: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('demo@email.com');
    setPassword('password123');
  };

  const fillAdminAccount = () => {
    setEmail('admin@cari.com');
    setPassword('admin123');
  };

  return (
    // ===== CONTAINER DENGAN BACKGROUND GAMBAR =====
    <div 
      className="min-h-screen flex items-center justify-center py-12 px-4 relative"
      style={{
        backgroundImage: 'url("https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* ===== OVERLAY GELAP + BLUR (EFEK PUDAR) ===== */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* ===== KONTEN LOGIN ===== */}
      <div className="relative z-10 bg-white/95 dark:bg-gray-800/95 backdrop-blur-md rounded-2xl shadow-2xl max-w-md w-full p-8 border border-white/20">
        {/* ===== HEADER ===== */}
        <div className="text-center mb-8">
          <div className="flex justify-center items-center gap-2 mb-3">
            <FaUtensils className="text-4xl text-pink-500" />
            <span className="text-2xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
              CariMakan
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {isLogin ? 'Selamat Datang Kembali!' : 'Daftar Akun Baru'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            {isLogin 
              ? 'Masuk untuk melanjutkan pesanan Anda' 
              : 'Buat akun untuk mulai memesan makanan'}
          </p>
        </div>

        {/* ===== ERROR MESSAGE ===== */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
            ⚠️ {error}
          </div>
        )}

        {/* ===== FORM ===== */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nama Lengkap
              </label>
              <div className="relative">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masukkan nama lengkap"
                  className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                  required={!isLogin}
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <div className="relative">
              <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Masukkan email"
                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <div className="relative">
              <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password (min. 6 karakter)"
                className="w-full pl-10 pr-12 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                required
                minLength={6}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-medium transition-all duration-300 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-xl hover:scale-[1.02]'
            }`}
          >
            {loading ? 'Memproses...' : (isLogin ? 'Masuk 🚀' : 'Daftar ✨')}
          </button>
        </form>

        {/* ===== TOGGLE LOGIN/REGISTER ===== */}
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLogin ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError('');
                setName('');
                setEmail('');
                setPassword('');
              }}
              className="text-pink-500 hover:text-pink-600 font-medium transition-colors"
            >
              {isLogin ? 'Daftar Sekarang' : 'Masuk'}
            </button>
          </p>
        </div>

        {/* ===== AKUN DEMO ===== */}
        <div className="mt-4 space-y-2">
          <div className="p-3 bg-gray-50/80 dark:bg-gray-700/80 rounded-xl backdrop-blur-sm">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center font-medium mb-2">
              📝 Akun Demo
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={fillDemoAccount}
                className="flex-1 text-xs bg-white dark:bg-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-500 transition-colors border border-gray-200 dark:border-gray-500"
              >
                👤 User: demo@email.com
              </button>
              <button
                type="button"
                onClick={fillAdminAccount}
                className="flex-1 text-xs bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 py-2 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/50 transition-colors border border-purple-200 dark:border-purple-700"
              >
                👑 Admin: admin@cari.com
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;