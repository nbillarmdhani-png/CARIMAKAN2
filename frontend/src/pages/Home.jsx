import { useState, useEffect } from 'react';
import FoodCard from '../components/FoodCard';
import SearchBar from '../components/SearchBar';
import SkeletonCard from '../components/SkeletonCard';
import { 
  FaSpinner, FaUtensils, FaExclamationTriangle, FaFire, 
  FaFilter, FaTimes, FaHome, FaChevronDown, FaChevronUp, 
  FaBars, FaTimes as FaClose, FaChevronLeft, FaChevronRight 
} from 'react-icons/fa';
import { indonesianFoods } from '../data/indonesianFoods';

const Home = () => {
  const [meals, setMeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('default');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [isCategoryOpen, setIsCategoryOpen] = useState(true);
  const [isSortOpen, setIsSortOpen] = useState(true);

  // ===== PAGINATION STATE =====
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const uniqueCategories = [...new Set(indonesianFoods.map(food => food.category))];
    setCategories(uniqueCategories.map(cat => ({ strCategory: cat })));
    loadMeals();
  }, []);

  useEffect(() => {
    filterAndSortMeals();
    setCurrentPage(1);
  }, [searchTerm, selectedCategory, sortBy]);

  const loadMeals = () => {
    setLoading(true);
    setError(null);
    try {
      setMeals(indonesianFoods);
      setLoading(false);
    } catch (err) {
      setError('Gagal memuat data makanan.');
      setLoading(false);
    }
  };

  const filterAndSortMeals = () => {
    let filtered = [...indonesianFoods];
    
    if (searchTerm) {
      filtered = filtered.filter(food =>
        food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        food.area.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (selectedCategory) {
      filtered = filtered.filter(food => food.category === selectedCategory);
    }

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    } else if (sortBy === 'name-asc') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'name-desc') {
      filtered.sort((a, b) => b.name.localeCompare(a.name));
    }
    
    setMeals(filtered);
  };

  // ===== PAGINATION LOGIC =====
  const totalPages = Math.ceil(meals.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentMeals = meals.slice(startIndex, endIndex);

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const getRecommendations = () => {
    const shuffled = [...indonesianFoods].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 4);
  };

  const recommendations = getRecommendations();

  const getCategoryIcon = (category) => {
    const icons = {
      'Main Course': '🍖',
      'Appetizer': '🍤',
      'Salad': '🥗',
      'Soup': '🍜',
      'Noodle': '🍝',
      'Rice': '🍚',
      'Dessert': '🍰',
      'Snack': '🍿',
      'Beverage': '🥤'
    };
    return icons[category] || '🍽️';
  };

  const CollapsibleSection = ({ title, icon, isOpen, onToggle, children }) => {
    return (
      <div className="border-b border-gray-200 dark:border-gray-700 pb-3 mb-3">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between text-left py-2 hover:text-pink-500 transition-colors group"
        >
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-2">
            {icon} {title}
          </span>
          <span className={`text-gray-400 group-hover:text-pink-500 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
            <FaChevronDown />
          </span>
        </button>
        <div
          className={`
            overflow-hidden transition-all duration-300 ease-in-out
            ${isOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'}
          `}
        >
          <div className="mt-2 space-y-1">
            {children}
          </div>
        </div>
      </div>
    );
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex gap-6 relative min-h-screen">
      {/* ===== SIDEBAR ===== */}
      <aside className={`
        fixed top-0 left-0 
        w-[280px] 
        h-screen 
        bg-white dark:bg-gray-800 
        shadow-2xl
        z-40
        transition-transform duration-300 ease-in-out
        flex flex-col
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-xl font-bold">
              🍽️
            </div>
            <div>
              <h2 className="text-white font-bold text-lg">CariMakan</h2>
              <p className="text-white/70 text-xs">Filter & Sortir</p>
            </div>
          </div>
          <button onClick={toggleSidebar} className="text-white hover:text-white/80 transition-colors">
            <FaClose className="text-xl" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          <div className="bg-pink-50 dark:bg-pink-900/20 rounded-xl p-3 mb-4">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              <span className="font-bold text-pink-500">{meals.length}</span> makanan ditemukan
            </p>
          </div>

          <CollapsibleSection
            title="Kategori"
            icon="📂"
            isOpen={isCategoryOpen}
            onToggle={() => setIsCategoryOpen(!isCategoryOpen)}
          >
            <button
              onClick={() => {
                setSelectedCategory('');
                if (window.innerWidth < 768) toggleSidebar();
              }}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                selectedCategory === ''
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <FaHome className="text-sm" />
              <span>Semua</span>
              {selectedCategory === '' && (
                <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>
              )}
            </button>
            {categories.map((cat, index) => (
              <button
                key={index}
                onClick={() => {
                  setSelectedCategory(cat.strCategory);
                  if (window.innerWidth < 768) toggleSidebar();
                }}
                className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                  selectedCategory === cat.strCategory
                    ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-base">{getCategoryIcon(cat.strCategory)}</span>
                <span className="truncate text-sm">{cat.strCategory}</span>
                {selectedCategory === cat.strCategory && (
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>
            ))}
          </CollapsibleSection>

          <CollapsibleSection
            title="Sortir"
            icon="📊"
            isOpen={isSortOpen}
            onToggle={() => setIsSortOpen(!isSortOpen)}
          >
            <button
              onClick={() => setSortBy('default')}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                sortBy === 'default'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>📋</span> Default
            </button>
            <button
              onClick={() => setSortBy('price-asc')}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                sortBy === 'price-asc'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>💰</span> Harga: Rendah→Tinggi
            </button>
            <button
              onClick={() => setSortBy('price-desc')}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                sortBy === 'price-desc'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>💰</span> Harga: Tinggi→Rendah
            </button>
            <button
              onClick={() => setSortBy('name-asc')}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                sortBy === 'name-asc'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>🔤</span> Nama: A→Z
            </button>
            <button
              onClick={() => setSortBy('name-desc')}
              className={`w-full text-left px-3 py-2 rounded-xl transition-all duration-200 flex items-center gap-2 ${
                sortBy === 'name-desc'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
              }`}
            >
              <span>🔤</span> Nama: Z→A
            </button>
          </CollapsibleSection>

          <button
            onClick={() => {
              setSelectedCategory('');
              setSortBy('default');
              setSearchTerm('');
              if (window.innerWidth < 768) toggleSidebar();
            }}
            className="w-full mt-4 py-2 text-sm text-pink-500 hover:text-pink-600 border border-pink-200 dark:border-pink-800 rounded-xl hover:bg-pink-50 dark:hover:bg-pink-900/20 transition-colors"
          >
            🔄 Reset Filter
          </button>
        </div>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-400 dark:text-gray-500 text-center">
          CariMakan v1.0
        </div>
      </aside>

      {/* ===== TOMBOL TOGGLE SIDEBAR ===== */}
      <button
        onClick={toggleSidebar}
        className={`
          fixed top-20 z-30
          flex items-center justify-center
          w-10 h-10 
          bg-gradient-to-r from-pink-500 to-purple-600 
          text-white rounded-full
          shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          hover:scale-105
          ${isSidebarOpen ? 'left-[290px]' : 'left-3'}
        `}
      >
        {isSidebarOpen ? <FaTimes className="text-sm" /> : <FaBars className="text-sm" />}
      </button>

      {/* ===== OVERLAY ===== */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={toggleSidebar} />
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-[280px]' : 'ml-0'}`}>
        <div className="container mx-auto px-4 py-6">
          {/* Hero Section */}
          <div className="text-center space-y-4 py-6 pt-16 md:pt-6">
            <h1 className="text-3xl md:text-5xl font-bold gradient-text">
              Makanan Indonesia
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-base md:text-lg max-w-2xl mx-auto">
              Temukan kelezatan kuliner Nusantara. Dari Sabang sampai Merauke!
            </p>
          </div>

          {/* Rekomendasi */}
          <div className="bg-gradient-to-r from-pink-50 to-purple-50 dark:from-pink-900/20 dark:to-purple-900/20 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <FaFire className="text-pink-500 text-xl" />
              <h2 className="text-lg font-bold text-gray-800 dark:text-white">🔥 Rekomendasi Hari Ini</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {recommendations.map((meal) => (
                <div key={meal.id} className="bg-white dark:bg-gray-800 rounded-xl p-3 flex items-center gap-3 hover:shadow-lg transition-all">
                  <img src={meal.image} alt={meal.name} className="w-12 h-12 object-cover rounded-lg" />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-800 dark:text-white text-xs truncate">{meal.name}</h4>
                    <p className="text-pink-600 dark:text-pink-400 text-xs font-medium">
                      {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(meal.price)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Search Bar */}
          <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

          {/* Info */}
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Menampilkan <span className="font-semibold">{meals.length}</span> makanan
              {selectedCategory && <span className="ml-2 text-pink-500">• {selectedCategory}</span>}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500">
              Halaman {currentPage} dari {totalPages || 1}
            </p>
          </div>

          {/* Results */}
          {loading ? (
            <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {Array.from({ length: 10 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FaExclamationTriangle className="text-5xl text-yellow-500" />
              <p className="mt-4 text-gray-600 dark:text-gray-400">{error}</p>
              <button
                onClick={loadMeals}
                className="mt-4 px-6 py-2 bg-pink-500 text-white rounded-xl hover:bg-pink-600 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          ) : meals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <FaUtensils className="text-5xl text-gray-300 dark:text-gray-600" />
              <p className="mt-4 text-gray-500 dark:text-gray-400">Tidak ada makanan ditemukan. Coba cari yang lain!</p>
            </div>
          ) : (
            <>
              <div className="grid gap-4 mt-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {currentMeals.map((meal) => (
                  <FoodCard key={meal.id} meal={meal} />
                ))}
              </div>

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8 py-4">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-2 rounded-xl transition-all duration-200 ${
                      currentPage === 1 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <FaChevronLeft className="text-sm" />
                  </button>

                  <div className="flex gap-1">
                    {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                      let pageNum;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }
                      return (
                        <button
                          key={i}
                          onClick={() => goToPage(pageNum)}
                          className={`w-9 h-9 rounded-xl transition-all duration-200 text-sm font-medium ${
                            currentPage === pageNum
                              ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                              : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 border border-gray-200 dark:border-gray-700'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-2 rounded-xl transition-all duration-200 ${
                      currentPage === totalPages 
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-400 cursor-not-allowed' 
                        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-pink-50 dark:hover:bg-pink-900/20 hover:text-pink-500 border border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <FaChevronRight className="text-sm" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Home;