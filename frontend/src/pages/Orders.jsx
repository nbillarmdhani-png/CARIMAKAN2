import { useState, useEffect } from 'react';
import { useOrder } from '../context/OrderContext';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import PaymentModal from '../components/PaymentModal';
import StrukModal from '../components/StrukModal';
import { 
  FaClock, 
  FaCheckCircle, 
  FaUtensils,
  FaMotorcycle,
  FaReceipt,
  FaMapMarkerAlt,
  FaSpinner,
  FaPlay,
  FaCheck,
  FaMoneyBill,
  FaChevronDown,
  FaChevronUp,
  FaPrint,
  FaLock
} from 'react-icons/fa';
import toast from 'react-hot-toast';

// ===== SKELETON ORDER =====
const SkeletonOrder = () => {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden animate-pulse">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-3 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
        </div>
        <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
      </div>
      <div className="p-4 space-y-2">
        {[1,2].map((i) => (
          <div key={i} className="flex items-center justify-between">
            <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            <div className="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        ))}
      </div>
      <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
        <div>
          <div className="h-3 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div>
          <div className="h-6 w-24 bg-gray-200 dark:bg-gray-700 rounded mt-1"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-9 w-24 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
        </div>
      </div>
    </div>
  );
};

const Orders = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { orders, updateOrderStatus, deleteOrder, processPayment } = useOrder();
  const { clearCart } = useCart();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isStrukOpen, setIsStrukOpen] = useState(false);
  const [selectedStrukOrder, setSelectedStrukOrder] = useState(null);

  // ===== STATE UNTUK ESTIMASI WAKTU =====
  const [timeRemaining, setTimeRemaining] = useState({});
  const [isPageLoading, setIsPageLoading] = useState(true);

  // ===== UPDATE ESTIMASI WAKTU REAL-TIME =====
  useEffect(() => {
    if (orders.length === 0) {
      setIsPageLoading(false);
      return;
    }

    setIsPageLoading(false);

    const updateEstimations = () => {
      const now = new Date();
      const newTimeRemaining = {};
      
      orders.forEach(order => {
        if (order.status === 'cooking' || order.status === 'ready') {
          const created = new Date(order.createdAt);
          const elapsed = Math.floor((now - created) / 60000);
          const totalTime = order.estimatedTime || 30;
          const remaining = Math.max(0, totalTime - elapsed);
          
          let statusText = '';
          let statusColor = '';
          if (remaining > 15) {
            statusText = `⏳ ${remaining} menit lagi`;
            statusColor = 'text-blue-500';
          } else if (remaining > 5) {
            statusText = `🔥 ${remaining} menit lagi`;
            statusColor = 'text-yellow-500';
          } else if (remaining > 0) {
            statusText = `⚡ ${remaining} menit lagi`;
            statusColor = 'text-orange-500';
          } else {
            statusText = '✅ Segera siap!';
            statusColor = 'text-green-500';
          }
          
          newTimeRemaining[order.id] = {
            remaining,
            statusText,
            statusColor,
            progress: Math.min(100, ((totalTime - remaining) / totalTime) * 100)
          };
        }
      });
      
      setTimeRemaining(newTimeRemaining);
    };

    updateEstimations();
    const interval = setInterval(updateEstimations, 30000);
    
    return () => clearInterval(interval);
  }, [orders]);

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

  const getStatusInfo = (status) => {
    const statusMap = {
      pending: { 
        label: '⏳ Menunggu Pembayaran', 
        icon: FaClock, 
        color: 'text-yellow-500', 
        bg: 'bg-yellow-100 dark:bg-yellow-900/30'
      },
      cooking: { 
        label: '👨‍🍳 Sedang Dimasak', 
        icon: FaUtensils, 
        color: 'text-blue-500', 
        bg: 'bg-blue-100 dark:bg-blue-900/30'
      },
      ready: { 
        label: '🍽️ Siap Diambil', 
        icon: FaCheckCircle, 
        color: 'text-green-500', 
        bg: 'bg-green-100 dark:bg-green-900/30'
      },
      completed: { 
        label: '✅ Selesai', 
        icon: FaMotorcycle, 
        color: 'text-purple-500', 
        bg: 'bg-purple-100 dark:bg-purple-900/30'
      }
    };
    return statusMap[status] || statusMap.pending;
  };

  const handlePayment = (order) => {
    setPaymentOrder(order);
    setIsPaymentOpen(true);
  };

  const handlePaymentSuccess = (paymentMethod, orderId) => {
    if (orderId) {
      processPayment(orderId, paymentMethod);
      setIsPaymentOpen(false);
      setPaymentOrder(null);
      
      toast.success(`💳 Pembayaran berhasil!\nMetode: ${paymentMethod}\nPesanan sedang dimasak! 👨‍🍳`, {
        duration: 4000,
        icon: '🎉',
      });
      
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  const handleCetakStruk = (order) => {
    setSelectedStrukOrder(order);
    setIsStrukOpen(true);
  };

  const handleUpdateStatus = (orderId, currentStatus) => {
    setLoading(true);
    
    const statusMap = {
      cooking: { nextStatus: 'ready', nextLabel: 'Siap Diambil' },
      ready: { nextStatus: 'completed', nextLabel: 'Selesai' }
    };
    
    const statusInfo = statusMap[currentStatus];
    if (!statusInfo) {
      setLoading(false);
      return;
    }

    if (!confirm(`Apakah Anda yakin ingin mengubah status menjadi "${statusInfo.nextLabel}"?`)) {
      setLoading(false);
      return;
    }

    try {
      setTimeout(() => {
        updateOrderStatus(orderId, statusInfo.nextStatus);
        setLoading(false);
        
        toast.success(`✅ Status pesanan berhasil diupdate menjadi "${statusInfo.nextLabel}"!`, {
          duration: 3000,
          icon: '🔄',
        });
        
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      }, 500);
    } catch (error) {
      toast.error('❌ Gagal mengupdate status. Silakan coba lagi.', {
        duration: 3000,
      });
      setLoading(false);
    }
  };

  const handleDeleteOrder = (orderId) => {
    if (confirm('Hapus pesanan ini?')) {
      deleteOrder(orderId);
      toast.success('🗑️ Pesanan berhasil dihapus', {
        duration: 2000,
        icon: '🗑️',
      });
    }
  };

  const renderStatusBadge = (status) => {
    const statusInfo = getStatusInfo(status);
    const Icon = statusInfo.icon;
    
    return (
      <div className={`px-3 py-1 rounded-full ${statusInfo.bg} flex items-center gap-2`}>
        <Icon className={statusInfo.color} />
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {statusInfo.label}
        </span>
      </div>
    );
  };

  const renderActionButton = (order) => {
    if (order.status === 'pending') {
      return (
        <button
          onClick={() => handlePayment(order)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm font-medium"
        >
          <FaMoneyBill />
          Bayar Sekarang 💳
        </button>
      );
    }

    if (isAdmin) {
      if (order.status === 'cooking') {
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, order.status)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all duration-300 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-pink-500 to-purple-600 hover:shadow-xl hover:scale-[1.02]'
            }`}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaPlay className="text-sm" />}
            {loading ? 'Memproses...' : 'Update: Siap Diambil'}
          </button>
        );
      }

      if (order.status === 'ready') {
        return (
          <button
            onClick={() => handleUpdateStatus(order.id, order.status)}
            disabled={loading}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white font-medium transition-all duration-300 ${
              loading 
                ? 'bg-gray-400 cursor-not-allowed' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-xl hover:scale-[1.02]'
            }`}
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaCheck className="text-sm" />}
            {loading ? 'Memproses...' : 'Selesaikan Pesanan ✅'}
          </button>
        );
      }

      if (order.status === 'completed') {
        return (
          <button
            onClick={() => handleCetakStruk(order)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm font-medium"
          >
            <FaPrint />
            Cetak Struk 🧾
          </button>
        );
      }
    }

    if (!isAdmin && order.status !== 'pending') {
      return (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-xs text-gray-500 dark:text-gray-400">
          <FaLock className="text-xs" />
          Menunggu Admin
        </div>
      );
    }

    return null;
  };

  // ===== LOADING STATE =====
  if (isPageLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonOrder key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">
            {isAdmin ? '📦 Pesanan Pelanggan' : '📦 Pesanan Saya'}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {orders.length} pesanan
            {isAdmin && (
              <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-0.5 rounded-full">
                👑 Admin - Lihat Semua Pesanan
              </span>
            )}
          </p>
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <FaReceipt className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
            {isAdmin ? 'Belum Ada Pesanan Pelanggan' : 'Belum Ada Pesanan'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400">
            {isAdmin ? 'Belum ada pelanggan yang melakukan pemesanan.' : 'Mulai pesan makanan favorit Anda sekarang!'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const statusInfo = getStatusInfo(order.status);
            const isExpanded = selectedOrder?.id === order.id;
            const timeInfo = timeRemaining[order.id];
            
            return (
              <div
                key={order.id}
                className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <span className="text-sm font-bold text-pink-600 dark:text-pink-400">
                      #{order.orderNumber}
                    </span>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {formatDate(order.createdAt)}
                    </p>
                    {order.deliveryAddress && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-1">
                        <FaMapMarkerAlt className="text-pink-400" />
                        {order.deliveryAddress}
                      </p>
                    )}
                    {isAdmin && order.userName && (
                      <p className="text-xs text-purple-500 dark:text-purple-400 mt-1">
                        👤 {order.userName}
                      </p>
                    )}
                    
                    {/* ===== ESTIMASI WAKTU ===== */}
                    {(order.status === 'cooking' || order.status === 'ready') && timeInfo && (
                      <div className="mt-2">
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-medium ${timeInfo.statusColor}`}>
                            {timeInfo.statusText}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-1">
                          <div 
                            className="bg-gradient-to-r from-pink-500 to-purple-600 h-1.5 rounded-full transition-all duration-1000"
                            style={{ width: `${timeInfo.progress || 0}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  {renderStatusBadge(order.status)}
                </div>

                <div className="p-4 space-y-2">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                      <span className="text-gray-700 dark:text-gray-300">
                        {item.name} 
                        <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({item.quantity}x)</span>
                      </span>
                      <span className="text-pink-600 dark:text-pink-400 font-medium">
                        {formatRupiah(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Pesanan</p>
                    <p className="text-xl font-bold text-pink-600 dark:text-pink-400">
                      {formatRupiah(order.totalPrice)}
                    </p>
                    {order.paymentMethod && (
                      <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                        <FaCheck className="text-xs" />
                        Dibayar via {order.paymentMethod}
                      </p>
                    )}
                    {order.paymentStatus === 'unpaid' && (
                      <p className="text-xs text-yellow-500 flex items-center gap-1 mt-1">
                        <FaClock className="text-xs" />
                        Belum dibayar
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {renderActionButton(order)}
                    
                    <button
                      onClick={() => setSelectedOrder(isExpanded ? null : order)}
                      className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm flex items-center gap-1"
                    >
                      {isExpanded ? (
                        <>
                          <FaChevronUp /> Sembunyikan
                        </>
                      ) : (
                        <>
                          <FaChevronDown /> Detail
                        </>
                      )}
                    </button>

                    {isAdmin && order.status === 'completed' && (
                      <button
                        onClick={() => handleDeleteOrder(order.id)}
                        className="px-4 py-2 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 transition-colors text-sm"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                    <h4 className="font-semibold text-gray-800 dark:text-white mb-3">📋 Detail Lengkap Pesanan</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Status:</span> {statusInfo.label}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Estimasi Waktu:</span> {order.estimatedTime || 30} menit
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Alamat:</span> {order.deliveryAddress || 'Tidak ada'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Metode Pembayaran:</span> {order.paymentMethod || 'Belum dibayar'}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          <span className="font-medium">Status Pembayaran:</span>{' '}
                          {order.paymentStatus === 'paid' ? '✅ Lunas' : '⏳ Belum dibayar'}
                        </p>
                        {isAdmin && (
                          <p className="text-gray-600 dark:text-gray-400">
                            <span className="font-medium">Pelanggan:</span> {order.userName || '-'}
                          </p>
                        )}
                      </div>

                      <div>
                        <p className="font-medium text-gray-700 dark:text-gray-300 mb-2">📦 Semua Item:</p>
                        <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                          {order.items.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-200 dark:border-gray-600 last:border-0">
                              <div className="flex items-center gap-2">
                                <img
                                  src={item.image || 'https://via.placeholder.com/32/FF6B6B/FFFFFF?text=' + item.name}
                                  alt={item.name}
                                  className="w-8 h-8 object-cover rounded"
                                  onError={(e) => {
                                    e.target.src = 'https://via.placeholder.com/32/FF6B6B/FFFFFF?text=' + item.name;
                                  }}
                                />
                                <span className="text-gray-700 dark:text-gray-300">
                                  {item.name} 
                                  <span className="text-gray-400 dark:text-gray-500 text-xs ml-1">({item.quantity}x)</span>
                                </span>
                              </div>
                              <span className="text-pink-600 dark:text-pink-400 font-medium">
                                {formatRupiah(item.price * item.quantity)}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        <div className="flex justify-between font-bold pt-2 mt-2 border-t-2 border-gray-300 dark:border-gray-600">
                          <span className="text-gray-800 dark:text-white">Total</span>
                          <span className="text-pink-600 dark:text-pink-400">{formatRupiah(order.totalPrice)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4">
        <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">📊 Status Pesanan:</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-gray-600 dark:text-gray-400">Menunggu Bayar</span>
            <span className="text-xs text-gray-400">(User bisa bayar)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span className="text-gray-600 dark:text-gray-400">Dimasak</span>
            <span className="text-xs text-gray-400">(Admin update)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600 dark:text-gray-400">Siap Diambil</span>
            <span className="text-xs text-gray-400">(Admin update)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500" />
            <span className="text-gray-600 dark:text-gray-400">Selesai ✅</span>
            <span className="text-xs text-gray-400">(Admin update)</span>
          </div>
        </div>
      </div>

      <PaymentModal
        isOpen={isPaymentOpen}
        onClose={() => {
          setIsPaymentOpen(false);
          setPaymentOrder(null);
        }}
        totalPrice={paymentOrder?.totalPrice || 0}
        orderId={paymentOrder?.id}
        onSuccess={handlePaymentSuccess}
      />

      <StrukModal
        isOpen={isStrukOpen}
        onClose={() => {
          setIsStrukOpen(false);
          setSelectedStrukOrder(null);
        }}
        order={selectedStrukOrder}
      />
    </div>
  );
};

export default Orders;