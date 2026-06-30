import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  FaUser, 
  FaEnvelope, 
  FaCalendar, 
  FaEdit, 
  FaSave, 
  FaTimes,
  FaPhone,
  FaMapMarkerAlt,
  FaBirthdayCake,
  FaUserTag,
  FaCamera,
  FaKey
} from 'react-icons/fa';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateProfile, changePassword, uploadAvatar } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    address: user?.address || '',
    birthDate: user?.birthDate || '',
    bio: user?.bio || ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // ===== AMBIL DATA USER DARI LOCAL STORAGE (FALLBACK) =====
  const getUserData = () => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const found = users.find(u => u.id === user?.id);
    return found || user;
  };

  const userData = getUserData();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // ===== UPDATE PROFIL =====
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await updateProfile(
        formData.name,
        formData.email,
        formData.phone,
        formData.address,
        formData.birthDate,
        formData.bio,
        user?.avatar || null
      );
      
      setSuccess('✅ Profil berhasil diperbarui!');
      setIsEditing(false);
      
      toast.success('✅ Profil berhasil diperbarui!', {
        duration: 2000,
        icon: '👤',
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      setError('Gagal memperbarui profil: ' + err.message);
      toast.error('❌ Gagal memperbarui profil', {
        duration: 2000,
      });
    } finally {
      setLoading(false);
    }
  };

  // ===== GANTI PASSWORD =====
  const handleChangePassword = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('⚠️ Semua field harus diisi!');
      return;
    }
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('⚠️ Password baru tidak cocok!');
      return;
    }
    if (passwordData.newPassword.length < 6) {
      toast.error('⚠️ Password minimal 6 karakter!');
      return;
    }

    try {
      await changePassword(passwordData.oldPassword, passwordData.newPassword);
      
      setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
      setShowChangePassword(false);
      toast.success('✅ Password berhasil diubah!', {
        duration: 2000,
        icon: '🔑',
      });
    } catch (err) {
      toast.error(`❌ ${err.message}`);
    }
  };

  // ===== UPLOAD FOTO PROFIL =====
  const handleUploadPhoto = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('⚠️ Ukuran file maksimal 2MB!');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await uploadAvatar(reader.result);
        toast.success('✅ Foto profil berhasil diupload!', {
          duration: 2000,
          icon: '📸',
        });
        setTimeout(() => window.location.reload(), 500);
      } catch (err) {
        toast.error(`❌ ${err.message}`);
      }
    };
    reader.readAsDataURL(file);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatJoinDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <p className="text-gray-500 dark:text-gray-400">Silakan login terlebih dahulu</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* ===== HEADER ===== */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">👤 Profil Saya</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola informasi akun Anda</p>
        </div>
        <div className="flex gap-2">
          {!isEditing && (
            <>
              <button
                onClick={() => setShowChangePassword(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <FaKey /> Ganti Password
              </button>
              <button
                onClick={() => setIsEditing(true)}
                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                <FaEdit /> Edit Profil
              </button>
            </>
          )}
        </div>
      </div>

      {/* ===== ERROR & SUCCESS ===== */}
      {error && (
        <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl text-sm">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl text-sm">
          {success}
        </div>
      )}

      {/* ===== PROFIL CARD ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        {/* Cover / Avatar */}
        <div className="relative">
          <div className="h-32 bg-gradient-to-r from-pink-500 to-purple-600"></div>
          <div className="absolute -bottom-12 left-6 group">
            <div className="w-24 h-24 rounded-full bg-white dark:bg-gray-800 border-4 border-white dark:border-gray-800 flex items-center justify-center shadow-lg relative">
              {userData.avatar ? (
                <img src={userData.avatar} alt={user.name} className="w-full h-full object-cover rounded-full" />
              ) : (
                <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 bg-pink-500 text-white p-2 rounded-full cursor-pointer hover:bg-pink-600 transition-colors shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <FaCamera className="text-sm" />
                <input type="file" accept="image/*" className="hidden" onChange={handleUploadPhoto} />
              </label>
            </div>
          </div>
          <div className="absolute bottom-3 right-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              user.role === 'admin' 
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
            }`}>
              {user.role === 'admin' ? '👑 Admin' : '👤 User'}
            </span>
          </div>
        </div>

        {/* Profile Info */}
        <div className="pt-14 pb-6 px-6">
          {isEditing ? (
            // ===== EDIT MODE =====
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FaUser className="inline mr-2" /> Nama Lengkap
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FaEnvelope className="inline mr-2" /> Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FaPhone className="inline mr-2" /> No. Telepon
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="0812-3456-7890"
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <FaBirthdayCake className="inline mr-2" /> Tanggal Lahir
                  </label>
                  <input
                    type="date"
                    name="birthDate"
                    value={formData.birthDate}
                    onChange={handleChange}
                    className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FaMapMarkerAlt className="inline mr-2" /> Alamat
                </label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Masukkan alamat lengkap"
                  rows="2"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <FaUserTag className="inline mr-2" /> Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  placeholder="Tentang Anda..."
                  rows="2"
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 transition-colors text-gray-800 dark:text-white"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all duration-300 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-xl hover:scale-[1.02]'
                  }`}
                >
                  <FaSave /> {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: user.name,
                      email: user.email,
                      phone: user.phone || '',
                      address: user.address || '',
                      birthDate: user.birthDate || '',
                      bio: user.bio || ''
                    });
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                >
                  <FaTimes /> Batal
                </button>
              </div>
            </form>
          ) : (
            // ===== VIEW MODE =====
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white">{userData.name}</h2>
                <p className="text-gray-500 dark:text-gray-400">{userData.email}</p>
                <span className={`inline-block mt-1 px-3 py-1 rounded-full text-xs font-medium ${
                  userData.role === 'admin' 
                    ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                }`}>
                  {userData.role === 'admin' ? '👑 Administrator' : '👤 Member'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <FaPhone className="text-pink-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">No. Telepon</p>
                    <p className="text-gray-800 dark:text-white font-medium">{userData.phone || '-'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <FaBirthdayCake className="text-pink-500" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Tanggal Lahir</p>
                    <p className="text-gray-800 dark:text-white font-medium">{formatDate(userData.birthDate)}</p>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <FaMapMarkerAlt className="text-pink-500 mt-1" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Alamat</p>
                  <p className="text-gray-800 dark:text-white font-medium">{userData.address || 'Belum diisi'}</p>
                </div>
              </div>

              {userData.bio && (
                <div className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                  <FaUserTag className="text-pink-500 mt-1" />
                  <div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Bio</p>
                    <p className="text-gray-800 dark:text-white font-medium">{userData.bio}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <FaCalendar className="text-pink-500" />
                <div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Bergabung Sejak</p>
                  <p className="text-gray-800 dark:text-white font-medium">{formatJoinDate(userData.createdAt)}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== MODAL GANTI PASSWORD ===== */}
      {showChangePassword && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold text-gray-800 dark:text-white">🔑 Ganti Password</h3>
              <button
                onClick={() => {
                  setShowChangePassword(false);
                  setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <FaTimes />
              </button>
            </div>
            <div className="space-y-3">
              <input
                type="password"
                placeholder="Password Lama"
                value={passwordData.oldPassword}
                onChange={(e) => setPasswordData({ ...passwordData, oldPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
              />
              <input
                type="password"
                placeholder="Password Baru (min. 6 karakter)"
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
              />
              <input
                type="password"
                placeholder="Konfirmasi Password Baru"
                value={passwordData.confirmPassword}
                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
              />
              <div className="flex gap-2 pt-2">
                <button
                  onClick={handleChangePassword}
                  className="flex-1 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
                >
                  Simpan
                </button>
                <button
                  onClick={() => {
                    setShowChangePassword(false);
                    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
                  }}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;