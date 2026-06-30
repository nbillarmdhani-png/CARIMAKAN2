import { useState } from 'react';
import { useOrder } from '../context/OrderContext';
import { useAuth } from '../context/AuthContext';
import { FaReceipt, FaFilter, FaCalendarAlt, FaDownload } from 'react-icons/fa';
import toast from 'react-hot-toast';

const TransactionHistory = () => {
  const { user } = useAuth();
  const { orders } = useOrder();
  const [filterMonth, setFilterMonth] = useState('');
  const [filterYear, setFilterYear] = useState('');

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

  const getStatusLabel = (status) => {
    const map = {
      pending: '⏳ Menunggu',
      cooking: '👨‍🍳 Dimasak',
      ready: '🍽️ Siap',
      completed: '✅ Selesai'
    };
    return map[status] || status;
  };

  const filteredOrders = orders.filter(order => {
    if (order.status !== 'completed') return false;
    const date = new Date(order.createdAt);
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    if (filterMonth && filterYear) {
      return month === filterMonth && year === parseInt(filterYear);
    }
    if (filterMonth) {
      return month === filterMonth;
    }
    if (filterYear) {
      return year === parseInt(filterYear);
    }
    return true;
  });

  const totalTransaksi = filteredOrders.length;
  const totalPendapatan = filteredOrders.reduce((sum, o) => sum + o.totalPrice, 0);

  const months = [
    { value: '01', label: 'Januari' },
        { value: '02', label: 'Februari' },
    { value: '03', label: 'Maret' },
    { value: '04', label: 'April' },
    { value: '05', label: 'Mei' },
    { value: '06', label: 'Juni' },
    { value: '07', label: 'Juli' },
    { value: '08', label: 'Agustus' },
    { value: '09', label: 'September' },
    { value: '10', label: 'Oktober' },
    { value: '11', label: 'November' },
    { value: '12', label: 'Desember' }
  ];

  const years = [];
  const currentYear = new Date().getFullYear();
  for (let i = currentYear; i >= currentYear - 5; i--) {
    years.push(i);
  }

  const resetFilter = () => {
    setFilterMonth('');
    setFilterYear('');
  };

  const exportToCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error('⚠️ Tidak ada data untuk di-export!');
      return;
    }

    let csv = 'No,Order #,Items,Total,Status,Tanggal\n';
    filteredOrders.forEach((order, index) => {
      const items = order.items.map(i => i.name).join(', ');
      csv += `${index + 1},${order.orderNumber},"${items}",${order.totalPrice},${getStatusLabel(order.status)},${formatDate(order.createdAt)}\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `riwayat_transaksi_${new Date().toISOString().slice(0,10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('✅ Export CSV berhasil!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📊 Riwayat Transaksi</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {totalTransaksi} transaksi selesai • Total {formatRupiah(totalPendapatan)}
          </p>
        </div>
        <button
          onClick={exportToCSV}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 text-sm"
        >
          <FaDownload /> Export CSV
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <FaFilter className="text-pink-500" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filter:</span>
          </div>
          <select
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white text-sm"
          >
            <option value="">Semua Bulan</option>
            {months.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
          <select
            value={filterYear}
            onChange={(e) => setFilterYear(e.target.value)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white text-sm"
          >
            <option value="">Semua Tahun</option>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
          <button
            onClick={resetFilter}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors text-sm"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Daftar Transaksi */}
      {filteredOrders.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center">
          <FaReceipt className="text-6xl text-gray-300 dark:text-gray-600 mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Belum Ada Transaksi</h2>
          <p className="text-gray-500 dark:text-gray-400">
            {filterMonth || filterYear ? 'Tidak ada transaksi untuk filter ini.' : 'Belum ada transaksi selesai.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300">
              <div className="p-4 border-b border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <span className="text-sm font-bold text-pink-600 dark:text-pink-400">#{order.orderNumber}</span>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</p>
                </div>
                <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-xs font-medium">
                  ✅ Selesai
                </span>
              </div>
              <div className="p-4 space-y-2">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between text-sm py-1 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-gray-700 dark:text-gray-300">
                      {item.name} <span className="text-gray-400 dark:text-gray-500 text-xs">({item.quantity}x)</span>
                    </span>
                    <span className="text-pink-600 dark:text-pink-400 font-medium">{formatRupiah(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
                  <p className="text-xl font-bold text-pink-600 dark:text-pink-400">{formatRupiah(order.totalPrice)}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500 dark:text-gray-400">Metode Pembayaran</p>
                  <p className="text-sm font-medium text-green-500">{order.paymentMethod || '-'}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionHistory;