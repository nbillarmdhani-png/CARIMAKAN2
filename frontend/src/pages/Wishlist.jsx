import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import { FaHeart, FaTrash, FaUtensils } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Wishlist = () => {
  const { wishlist, removeFromWishlist } = useWishlist();

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleRemove = (mealId, mealName) => {
    removeFromWishlist(mealId);
    toast.success(`❤️ ${mealName} dihapus dari favorit`, {
      duration: 2000,
      icon: '💔',
    });
  };

  const handleClearAll = () => {
    if (confirm('Hapus semua favorit?')) {
      wishlist.forEach(item => removeFromWishlist(item.id));
      toast.success('🗑️ Semua favorit telah dihapus', {
        duration: 2000,
        icon: '🗑️',
      });
    }
  };

  if (wishlist.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
        <FaHeart className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Belum Ada Favorit</h2>
        <p className="text-gray-500 dark:text-gray-400">
          Mulai tambahkan makanan favorit dengan klik ❤️ di card makanan
        </p>
        <Link
          to="/"
          className="mt-6 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
        >
          Jelajahi Makanan
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">❤️ Favorit Saya</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {wishlist.length} makanan favorit
          </p>
        </div>
        <button
          onClick={handleClearAll}
          className="text-red-500 hover:text-red-700 transition-colors text-sm flex items-center gap-1"
        >
          <FaTrash /> Hapus Semua
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {wishlist.map((meal) => (
          <div
            key={meal.id}
            className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="relative aspect-square">
              <img
                src={meal.image}
                alt={meal.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=' + meal.name;
                }}
              />
              <button
                onClick={() => handleRemove(meal.id, meal.name)}
                className="absolute top-2 right-2 p-1.5 rounded-full bg-red-500 text-white shadow-md hover:scale-110 transition-all duration-300"
                title="Hapus dari favorit"
              >
                <FaHeart className="text-sm" />
              </button>
            </div>
            <div className="p-2.5">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                {meal.name}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{meal.area} • {meal.category}</p>
              <div className="flex items-center justify-between mt-2">
                <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                  {formatRupiah(meal.price)}
                </span>
                <Link
                  to={`/meal/${meal.id}`}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300 text-xs font-medium"
                >
                  Detail
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Wishlist;