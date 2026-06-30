import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { FaHeart, FaShoppingCart, FaStar, FaClock } from 'react-icons/fa';
import { useState } from 'react';
import toast from 'react-hot-toast';

const FoodCard = ({ meal }) => {
  const { addToCart } = useCart();
  const { isInWishlist, addToWishlist } = useWishlist();
  const [imageLoaded, setImageLoaded] = useState(false);

  const randomRating = (Math.random() * 2 + 3).toFixed(1);
  const randomTime = Math.floor(Math.random() * 30 + 15);
  const isFavorite = isInWishlist(meal.id);

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleAddToCart = () => {
    addToCart({ ...meal, price: meal.price });
    toast.success(`🛒 ${meal.name} ditambahkan ke keranjang!`, {
      duration: 2000,
      icon: '✅',
    });
    const btn = document.getElementById(`cart-btn-${meal.id}`);
    if (btn) {
      btn.classList.add('scale-110');
      setTimeout(() => btn.classList.remove('scale-110'), 200);
    }
  };

  const handleToggleWishlist = () => {
    addToWishlist(meal);
    if (isFavorite) {
      toast.success(`❤️ ${meal.name} dihapus dari favorit`, {
        duration: 2000,
        icon: '💔',
      });
    } else {
      toast.success(`❤️ ${meal.name} ditambahkan ke favorit`, {
        duration: 2000,
        icon: '⭐',
      });
    }
    const btn = document.getElementById(`wishlist-btn-${meal.id}`);
    if (btn) {
      btn.classList.add('scale-150');
      setTimeout(() => btn.classList.remove('scale-150'), 300);
    }
  };

  return (
    <div className="group relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
      <div className="relative overflow-hidden aspect-square">
        {!imageLoaded && (
          <div className="absolute inset-0 bg-gradient-to-br from-gray-100 dark:from-gray-700 to-gray-200 dark:to-gray-600 animate-pulse" />
        )}
        <img
          src={meal.image}
          alt={meal.name}
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
            imageLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setImageLoaded(true)}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=' + meal.name;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <button
          id={`wishlist-btn-${meal.id}`}
          onClick={handleToggleWishlist}
          className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm shadow-md hover:scale-110 transition-all duration-300 z-10"
        >
          <FaHeart className={`text-sm transition-colors ${isFavorite ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`} />
        </button>

        <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs">
            <FaStar className="text-yellow-400 text-xs" /> {randomRating}
          </span>
          <span className="flex items-center gap-1 bg-black/50 backdrop-blur-sm px-2 py-0.5 rounded-full text-xs">
            <FaClock className="text-xs" /> {randomTime}m
          </span>
        </div>
      </div>

      <div className="p-2.5">
        <div className="flex items-start justify-between mb-1">
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-800 dark:text-white group-hover:text-pink-600 dark:group-hover:text-pink-400 transition-colors truncate">
              {meal.name}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{meal.area} • {meal.category}</p>
          </div>
          <span className="text-sm font-bold text-pink-600 dark:text-pink-400 ml-1 whitespace-nowrap">
            {formatRupiah(meal.price)}
          </span>
        </div>

        <div className="flex items-center gap-1.5 mt-2">
          <Link to={`/meal/${meal.id}`} className="flex-1 text-center px-2 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg hover:scale-[1.02] transition-all duration-300 text-xs font-medium">
            Detail
          </Link>
          <button
            id={`cart-btn-${meal.id}`}
            onClick={handleAddToCart}
            className="p-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-pink-100 dark:hover:bg-pink-900/30 rounded-lg transition-all duration-300 group/btn hover:scale-110"
          >
            <FaShoppingCart className="text-xs text-gray-600 dark:text-gray-300 group-hover/btn:text-pink-600 dark:group-hover/btn:text-pink-400 transition-colors" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FoodCard;