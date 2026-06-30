import { Link, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useOrder } from '../context/OrderContext';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { useVoucher } from '../context/VoucherContext';
import { 
  FaShoppingCart, 
  FaUtensils, 
  FaMoon, 
  FaSun, 
  FaSearch, 
  FaHeart, 
  FaReceipt,
  FaUser,
  FaSignOutAlt,
  FaUserCircle,
  FaChartBar,
  FaUserEdit,
  FaComment,
  FaTicketAlt
} from 'react-icons/fa';
import { useState } from 'react';
import toast from 'react-hot-toast';

const Navbar = () => {
  const location = useLocation();
  const { getTotalItems, cart, removeFromCart, updateQuantity, getTotalPrice, clearCart } = useCart();
  const { getTotalWishlist } = useWishlist();
  const { createOrder } = useOrder();
  const { isDark, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { appliedVoucher, setAppliedVoucher } = useVoucher();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  
  const totalItems = getTotalItems();
  const totalWishlist = getTotalWishlist();

  // Sembunyikan Navbar di halaman login
  if (location.pathname === '/login') {
    return null;
  }

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  // ===== FUNGSI HITUNG TOTAL DENGAN VOUCHER =====
  const calculateFinalPrice = () => {
    const total = getTotalPrice();
    if (!appliedVoucher) return total;
    
    let discount = 0;
    if (appliedVoucher.type === 'percentage') {
      discount = (total * appliedVoucher.discount) / 100;
    } else {
      discount = appliedVoucher.discount;
    }
    return Math.max(0, total - discount);
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast.error('Keranjang kosong!');
      return;
    }
    setIsCheckoutModalOpen(true);
  };

  // ===== CONFIRM CHECKOUT DENGAN VOUCHER =====
  const confirmCheckout = async () => {
    if (!deliveryAddress.trim()) {
      toast.error('⚠️ Silakan isi alamat pengiriman!');
      return;
    }
    
    try {
      const totalPrice = calculateFinalPrice();
      
      // ===== HITUNG POTONGAN VOUCHER =====
      let voucherDiscount = 0;
      let voucherCode = null;
      if (appliedVoucher) {
        const originalTotal = getTotalPrice();
        if (appliedVoucher.type === 'percentage') {
          voucherDiscount = (originalTotal * appliedVoucher.discount) / 100;
        } else {
          voucherDiscount = appliedVoucher.discount;
        }
        voucherCode = appliedVoucher.code;
        console.log('🎫 Voucher applied:', { voucherCode, voucherDiscount, originalTotal, totalPrice });
      }
      
      // ===== KIRIM DATA VOUCHER KE ORDER =====
      const newOrder = await createOrder(cart, totalPrice, deliveryAddress, voucherCode, voucherDiscount);
      
      clearCart();
      setIsCheckoutModalOpen(false);
      setIsCartOpen(false);
      setDeliveryAddress('');
      setAppliedVoucher(null);
      
      toast.success(`✅ Pesanan berhasil dibuat!\n📋 No. Order: ${newOrder.orderNumber}\n💰 Total: ${formatRupiah(totalPrice)}`, {
        duration: 4000,
        icon: '🎉',
      });
    } catch (error) {
      console.error('❌ Error creating order:', error);
      toast.error('❌ Gagal membuat pesanan. Silakan coba lagi.');
    }
  };

  const handleLogout = () => {
    if (confirm('Apakah Anda yakin ingin keluar?')) {
      logout();
      setIsUserMenuOpen(false);
    }
  };

  return (
    <>
      <nav className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-300">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* ===== LOGO ===== */}
            <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
              <div className="relative">
                <FaUtensils className="text-3xl text-pink-500 dark:text-pink-400 group-hover:rotate-12 transition-transform duration-300" />
                <div className="absolute -top-1 -right-1 w-2 h-2 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-600 bg-clip-text text-transparent">
                CariMakan
              </span>
            </Link>

            {/* ===== MENU DESKTOP ===== */}
            <div className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1">
                <FaSearch className="text-sm" />
                <span>Explore</span>
              </Link>
              
              <Link to="/orders" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1">
                <FaReceipt className="text-sm" />
                <span>Pesanan</span>
              </Link>
              
              <Link to="/wishlist" className="relative text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1">
                <FaHeart />
                <span>Favorit</span>
                {totalWishlist > 0 && (
                  <span className="absolute -top-2 -right-4 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {totalWishlist}
                  </span>
                )}
              </Link>

              <Link to="/chat" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1">
                <FaComment className="text-sm" />
                <span>Chat</span>
              </Link>

              <Link to="/voucher" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1">
                <FaTicketAlt className="text-sm" />
                <span>Voucher</span>
              </Link>

              {/* Admin Menu - Hanya untuk admin */}
              {user?.role === 'admin' && (
                <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors flex items-center gap-1">
                  <FaChartBar className="text-sm" />
                  <span>Admin</span>
                </Link>
              )}
              
              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                aria-label="Toggle theme"
              >
                {isDark ? <FaSun className="text-yellow-400 text-xl" /> : <FaMoon className="text-gray-600 dark:text-gray-300 text-xl" />}
              </button>

              {/* Cart */}
              <button
                onClick={() => setIsCartOpen(!isCartOpen)}
                className="relative hover:scale-110 transition-transform"
                aria-label="Open cart"
              >
                <FaShoppingCart className="text-2xl text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors" />
                {totalItems > 0 && (
                  <span className="absolute -top-2 -right-2 bg-pink-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* ===== USER MENU ===== */}
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 dark:hover:text-pink-400 transition-colors"
                  aria-label="User menu"
                >
                  {user ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                      {user.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  ) : (
                    <FaUserCircle className="text-2xl" />
                  )}
                </button>

                {/* Dropdown User Menu */}
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 py-2 animate-slide-up z-50">
                    {user ? (
                      <>
                        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                          <p className="text-sm font-semibold text-gray-800 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{user.email}</p>
                          {user.role === 'admin' && (
                            <span className="inline-block mt-1 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                              👑 Admin
                            </span>
                          )}
                        </div>
                        
                        <Link
                          to="/profile"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FaUserEdit className="inline mr-2" /> Profil Saya
                        </Link>
                        
                        {user?.role === 'admin' && (
                          <Link
                            to="/admin"
                            className="block px-4 py-2 text-sm text-purple-600 dark:text-purple-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 mt-1 pt-2"
                            onClick={() => setIsUserMenuOpen(false)}
                          >
                            <FaChartBar className="inline mr-2" /> Dashboard Admin
                          </Link>
                        )}
                        
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-t border-gray-200 dark:border-gray-700 mt-1 pt-2"
                        >
                          <FaSignOutAlt className="inline mr-2" /> Keluar
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          <FaUser className="inline mr-2" /> Masuk
                        </Link>
                        <Link
                          to="/login"
                          className="block px-4 py-2 text-sm text-pink-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => setIsUserMenuOpen(false)}
                        >
                          Daftar
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* ===== MOBILE MENU BUTTON ===== */}
            <button
              className="md:hidden text-gray-600 dark:text-gray-300 hover:text-pink-600"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* ===== MOBILE MENU ===== */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
              <Link to="/" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors" onClick={() => setIsMenuOpen(false)}>
                <FaSearch className="inline mr-2" /> Explore
              </Link>
              <Link to="/orders" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <FaReceipt /> Pesanan
              </Link>
              <Link to="/wishlist" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <FaHeart /> Favorit {totalWishlist > 0 && `(${totalWishlist})`}
              </Link>
              <Link to="/chat" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <FaComment /> Chat
              </Link>
              <Link to="/voucher" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                <FaTicketAlt /> Voucher
              </Link>
              
              {user?.role === 'admin' && (
                <Link to="/admin" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                  <FaChartBar /> Dashboard Admin
                </Link>
              )}
              
              <div className="py-2 border-t border-gray-200 dark:border-gray-700 mt-2">
                {user ? (
                  <>
                    <div className="py-2">
                      <p className="text-sm font-semibold text-gray-800 dark:text-white px-2">{user.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 px-2">{user.email}</p>
                      {user.role === 'admin' && (
                        <span className="inline-block mt-1 ml-2 px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-xs rounded-full">
                          👑 Admin
                        </span>
                      )}
                    </div>
                    <Link to="/profile" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                      <FaUserEdit /> Profil Saya
                    </Link>
                    <button
                      onClick={() => {
                        handleLogout();
                        setIsMenuOpen(false);
                      }}
                      className="block w-full text-left py-2 text-red-500 hover:text-red-600 transition-colors flex items-center gap-2"
                    >
                      <FaSignOutAlt /> Keluar
                    </button>
                  </>
                ) : (
                  <Link to="/login" className="block py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2" onClick={() => setIsMenuOpen(false)}>
                    <FaUser /> Masuk
                  </Link>
                )}
              </div>
              
              <button
                onClick={() => { 
                  toggleTheme(); 
                  setIsMenuOpen(false); 
                }}
                className="block w-full text-left py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2"
              >
                {isDark ? <FaSun /> : <FaMoon />} {isDark ? 'Mode Terang' : 'Mode Gelap'}
              </button>
              <button
                onClick={() => { 
                  setIsCartOpen(!isCartOpen); 
                  setIsMenuOpen(false); 
                }}
                className="block w-full text-left py-2 text-gray-600 dark:text-gray-300 hover:text-pink-600 transition-colors flex items-center gap-2"
              >
                <FaShoppingCart />
                Keranjang {totalItems > 0 && `(${totalItems})`}
              </button>
            </div>
          )}
        </div>
      </nav>

      {/* ===== CART SIDEBAR ===== */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 overflow-hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCartOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl animate-slide-up">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-800 dark:text-white">🛒 Keranjang</h2>
                <button
                  onClick={() => setIsCartOpen(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {cart.length === 0 ? (
                  <div className="text-center py-12">
                    <FaShoppingCart className="text-6xl text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">Keranjang kosong</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Mulai tambahkan makanan favorit!</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 bg-gray-50 dark:bg-gray-700 rounded-xl p-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                          onError={(e) => {
                            e.target.src = 'https://via.placeholder.com/64/FF6B6B/FFFFFF?text=' + item.name;
                          }}
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800 dark:text-white text-sm">{item.name}</h4>
                          <p className="text-pink-600 dark:text-pink-400 font-medium">
                            {formatRupiah(item.price || 0)}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity - 1)}
                              className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-white"
                            >
                              -
                            </button>
                            <span className="text-sm font-medium w-6 text-center text-gray-800 dark:text-white">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, item.quantity + 1)}
                              className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-full hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-gray-700 dark:text-white"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="text-red-500 hover:text-red-700 text-xl"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {cart.length > 0 && (
                <div className="border-t dark:border-gray-700 p-4 space-y-3">
                  {/* Tampilkan voucher jika ada */}
                  {appliedVoucher && (
                    <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-medium text-green-600 dark:text-green-400">
                            🎫 Voucher {appliedVoucher.code}
                          </p>
                          <p className="text-xs text-green-500 dark:text-green-400">
                            Potongan: {appliedVoucher.type === 'percentage' 
                              ? `${appliedVoucher.discount}%` 
                              : formatRupiah(appliedVoucher.discount)}
                          </p>
                        </div>
                        <button
                          onClick={() => setAppliedVoucher(null)}
                          className="text-xs text-red-500 hover:text-red-700"
                        >
                          Hapus
                        </button>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-lg font-semibold">
                    <span className="text-gray-700 dark:text-gray-300">Total:</span>
                    <span className="text-pink-600 dark:text-pink-400">
                      {formatRupiah(calculateFinalPrice())}
                    </span>
                  </div>
                  
                  {appliedVoucher && (
                    <div className="flex justify-between text-sm text-gray-400 dark:text-gray-500">
                      <span>Harga awal</span>
                      <span className="line-through">{formatRupiah(getTotalPrice())}</span>
                    </div>
                  )}
                  
                  <button
                    onClick={handleCheckout}
                    className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
                  >
                    Checkout 🚀
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== CHECKOUT MODAL ===== */}
      {isCheckoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setIsCheckoutModalOpen(false)} />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-slide-up">
            <button
              onClick={() => setIsCheckoutModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">📝 Konfirmasi Pesanan</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Ringkasan Pesanan</p>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-3 max-h-32 overflow-y-auto">
                  {cart.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm py-1 border-b border-gray-200 dark:border-gray-600 last:border-0">
                      <span className="text-gray-700 dark:text-gray-300">{item.name} x{item.quantity}</span>
                      <span className="text-pink-600 dark:text-pink-400">{formatRupiah(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* ===== VOUCHER DISPLAY ===== */}
              {appliedVoucher && (
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">
                        🎫 Voucher {appliedVoucher.code}
                      </p>
                      <p className="text-xs text-green-500 dark:text-green-400">
                        Potongan: {appliedVoucher.type === 'percentage' 
                          ? `${appliedVoucher.discount}%` 
                          : formatRupiah(appliedVoucher.discount)}
                      </p>
                    </div>
                    <button
                      onClick={() => setAppliedVoucher(null)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              )}

              {/* Total */}
              <div>
                <div className="flex justify-between text-lg font-semibold">
                  <span className="text-gray-700 dark:text-gray-300">Total:</span>
                  <span className="text-pink-600 dark:text-pink-400">
                    {formatRupiah(calculateFinalPrice())}
                  </span>
                </div>
                {appliedVoucher && (
                  <div className="flex justify-between text-sm text-gray-400 dark:text-gray-500 mt-1">
                    <span>Harga awal</span>
                    <span className="line-through">{formatRupiah(getTotalPrice())}</span>
                  </div>
                )}
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-1">
                  Alamat Pengiriman
                </label>
                <textarea
                  value={deliveryAddress}
                  onChange={(e) => setDeliveryAddress(e.target.value)}
                  placeholder="Masukkan alamat lengkap..."
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-800 dark:text-white focus:outline-none focus:border-pink-500"
                  rows="3"
                />
              </div>

              <button
                onClick={confirmCheckout}
                className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-medium hover:shadow-xl hover:scale-[1.02] transition-all duration-300"
              >
                Konfirmasi Pesanan ✅
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
