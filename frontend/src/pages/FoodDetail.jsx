import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useRating } from '../context/RatingContext';
import { useAuth } from '../context/AuthContext';
import SkeletonDetail from '../components/SkeletonDetail';
import { 
  FaArrowLeft, FaSpinner, FaStar, FaClock, FaUtensils, 
  FaShoppingCart, FaCheckCircle, FaStore, FaUser, FaTrash 
} from 'react-icons/fa';
import { indonesianFoods } from '../data/indonesianFoods';
import toast from 'react-hot-toast';

const FoodDetail = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const { addToCart } = useCart();
  const { 
    addRating, 
    getRatingsByMeal, 
    getAverageRating, 
    getRatingCount,
    getUserRating,
    deleteRating 
  } = useRating();
  
  const [meal, setMeal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [addedToCart, setAddedToCart] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [userComment, setUserComment] = useState('');
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [mealRatings, setMealRatings] = useState([]);
  const [hoverRating, setHoverRating] = useState(0);

  useEffect(() => {
    fetchMealDetail();
    window.scrollTo(0, 0);
  }, [id]);

  const fetchMealDetail = () => {
    setLoading(true);
    setError(null);
    try {
      const foundMeal = indonesianFoods.find(food => food.id === id);
      if (foundMeal) {
        setMeal(foundMeal);
        setMealRatings(getRatingsByMeal(id));
      } else {
        setError('Makanan tidak ditemukan');
      }
    } catch (err) {
      setError('Gagal memuat detail makanan');
    } finally {
      setLoading(false);
    }
  };

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleAddToCart = () => {
    if (meal) {
      addToCart({ ...meal, price: meal.price });
      setAddedToCart(true);
      toast.success(`🛒 ${meal.name} ditambahkan ke keranjang!`);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleSubmitRating = () => {
    if (!user) {
      toast.error('⚠️ Silakan login terlebih dahulu!');
      return;
    }
    if (userRating === 0) {
      toast.error('⚠️ Silakan beri rating terlebih dahulu!');
      return;
    }
    if (!userComment.trim()) {
      toast.error('⚠️ Silakan tulis komentar!');
      return;
    }

    addRating(id, user.id, user.name, userRating, userComment);
    setMealRatings(getRatingsByMeal(id));
    setUserRating(0);
    setUserComment('');
    setShowRatingForm(false);
    toast.success('⭐ Terima kasih atas rating dan review Anda!');
  };

  const handleDeleteRating = (ratingId) => {
    if (confirm('Hapus rating ini?')) {
      deleteRating(ratingId);
      setMealRatings(getRatingsByMeal(id));
      toast.success('🗑️ Rating berhasil dihapus');
    }
  };

  const averageRating = getAverageRating(id);
  const ratingCount = getRatingCount(id);
  const userExistingRating = getUserRating(id, user?.id);

  if (loading) {
    return <SkeletonDetail />;
  }

  if (error || !meal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <div className="text-6xl mb-4">🍽️</div>
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Makanan Tidak Ditemukan</h2>
        <p className="text-gray-500 dark:text-gray-400 mb-6">{error || 'Makanan yang Anda cari tidak tersedia'}</p>
        <Link to="/" className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300">
          Kembali ke Beranda
        </Link>
      </div>
    );
  }

  const randomTime = Math.floor(Math.random() * 30 + 15);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Link to="/" className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-pink-600 dark:hover:text-pink-400 transition-colors group">
        <FaArrowLeft className="group-hover:-translate-x-1 transition-transform" />
        Kembali ke Beranda
      </Link>

      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl transition-colors duration-300">
        {/* Gambar */}
        <div className="relative h-72 md:h-96">
          <img src={meal.image} alt={meal.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
          <div className="absolute bottom-6 left-6 right-6 text-white">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className="bg-pink-500 text-xs px-3 py-1 rounded-full">{meal.category}</span>
              <span className="bg-purple-500 text-xs px-3 py-1 rounded-full">{meal.area}</span>
              {meal.restaurant && (
                <span className="bg-blue-500 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                  <FaStore className="text-xs" />
                  {meal.restaurant}
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold">{meal.name}</h1>
          </div>
        </div>

        {/* Konten */}
        <div className="p-6 md:p-8 space-y-6">
          {/* Rating & Waktu */}
          <div className="flex flex-wrap items-center gap-6 text-sm">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaStar className="text-yellow-400" />
              {averageRating} / 5.0 ({ratingCount} rating)
            </span>
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaClock className="text-pink-400" />
              {randomTime} menit
            </span>
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              <FaUtensils className="text-pink-400" />
              {meal.category}
            </span>
          </div>

          {/* Nama Restoran */}
          {meal.restaurant && (
            <div className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <FaStore className="text-pink-500 text-lg" />
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Restoran</p>
                <p className="font-semibold text-gray-800 dark:text-white">{meal.restaurant}</p>
              </div>
            </div>
          )}

          {/* Harga & Add to Cart */}
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/30 dark:to-purple-900/30 rounded-xl">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Harga</p>
              <p className="text-3xl font-bold gradient-text">{formatRupiah(meal.price)}</p>
            </div>
            <button
              onClick={handleAddToCart}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
                addedToCart ? 'bg-green-500 text-white' : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:scale-[1.02]'
              }`}
            >
              {addedToCart ? <><FaCheckCircle /> Ditambahkan!</> : <><FaShoppingCart /> Tambah ke Keranjang</>}
            </button>
          </div>

          {/* Deskripsi */}
          {meal.description && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">📝 Deskripsi</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{meal.description}</p>
            </div>
          )}

          {/* Bahan-bahan */}
          {meal.ingredients && meal.ingredients.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">🛒 Bahan-bahan</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {meal.ingredients.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-pink-50 dark:hover:bg-pink-900/30 transition-colors">
                    <span className="text-pink-500 dark:text-pink-400 text-sm">•</span>
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cara Membuat */}
          {meal.instructions && (
            <div>
              <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-3">👨‍🍳 Cara Membuat</h2>
              <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
                {meal.instructions.split('\n').map((step, index) => (
                  <div key={index} className="flex gap-3 py-2 border-b border-gray-200 dark:border-gray-600 last:border-0">
                    <span className="text-pink-500 dark:text-pink-400 font-bold min-w-[24px]">{index + 1}.</span>
                    <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ===== RATING & REVIEW SECTION ===== */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-bold text-gray-800 dark:text-white">⭐ Rating & Review</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {ratingCount} ulasan • Rata-rata {averageRating} dari 5
                </p>
              </div>
              {!showRatingForm && !userExistingRating && (
                <button
                  onClick={() => setShowRatingForm(true)}
                  className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm"
                >
                  ✏️ Tulis Review
                </button>
              )}
            </div>

            {/* Form Rating */}
            {showRatingForm && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      onClick={() => setUserRating(star)}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      className="text-3xl transition-all duration-200 hover:scale-110"
                    >
                      <FaStar 
                        className={`${(hoverRating || userRating) >= star ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">
                    {userRating > 0 ? `${userRating} bintang` : 'Pilih rating'}
                  </span>
                </div>
                <textarea
                  value={userComment}
                  onChange={(e) => setUserComment(e.target.value)}
                  placeholder="Tulis review Anda..."
                  className="w-full p-3 bg-white dark:bg-gray-600 rounded-xl border border-gray-200 dark:border-gray-500 focus:outline-none focus:border-pink-500 dark:focus:border-pink-400 text-gray-800 dark:text-white"
                  rows="3"
                />
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={handleSubmitRating}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-300 text-sm"
                  >
                    Kirim Review
                  </button>
                  <button
                    onClick={() => {
                      setShowRatingForm(false);
                      setUserRating(0);
                      setUserComment('');
                    }}
                    className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-all duration-300 text-sm"
                  >
                    Batal
                  </button>
                </div>
              </div>
            )}

            {/* Daftar Review */}
            <div className="mt-4 space-y-3">
              {mealRatings.length === 0 ? (
                <p className="text-gray-400 dark:text-gray-500 text-sm text-center py-4">
                  Belum ada review. Jadilah yang pertama!
                </p>
              ) : (
                mealRatings.map((r) => (
                  <div key={r.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold">
                          {r.userName?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-medium text-gray-800 dark:text-white text-sm">{r.userName}</p>
                          <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <FaStar key={star} className={`text-xs ${star <= r.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-500'}`} />
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.createdAt)}</span>
                        {user?.id === r.userId && (
                          <button
                            onClick={() => handleDeleteRating(r.id)}
                            className="text-red-500 hover:text-red-700 transition-colors text-sm"
                          >
                            <FaTrash />
                          </button>
                        )}
                      </div>
                    </div>
                    {r.comment && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{r.comment}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodDetail;