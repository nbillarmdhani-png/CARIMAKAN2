import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { userAPI, orderAPI } from '../services/api';
import { FaUsers, FaShoppingBag, FaUtensils, FaChartBar, FaTrash, FaFileExcel, FaUserTimes, FaChartLine, FaChartPie, FaFilePdf } from 'react-icons/fa';
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';
import toast from 'react-hot-toast';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== STATE UNTUK LAPORAN =====
  const [reportType, setReportType] = useState('daily');
  const [reportData, setReportData] = useState({ 
    labels: [], 
    values: [], 
    counts: [], 
    totalRevenue: 0, 
    totalOrders: 0 
  });
  const reportRef = useRef();

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

  // ===== LOAD DATA DARI API =====
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Ambil users dari API
      const usersData = await userAPI.getAll();
      setUsers(usersData);
      
      // Ambil orders dari API
      const ordersData = await orderAPI.getAll(null, 'admin');
      setOrders(ordersData);
      
      console.log('✅ Data loaded:', { users: usersData.length, orders: ordersData.length });
    } catch (error) {
      console.error('❌ Error loading data:', error);
      toast.error('Gagal memuat data. Menggunakan data lokal.');
      
      // Fallback ke localStorage
      const savedUsers = localStorage.getItem('users');
      if (savedUsers) setUsers(JSON.parse(savedUsers));
      
      const savedOrders = localStorage.getItem('orders');
      if (savedOrders) setOrders(JSON.parse(savedOrders));
    } finally {
      setLoading(false);
    }
  };

  const totalOrders = orders.length;
  const totalUsers = users.length;
  const totalRevenue = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
  const pendingOrders = orders.filter(o => o.status === 'pending').length;

  // ===== GENERATE LAPORAN =====
  const generateReport = () => {
    const now = new Date();
    let startDate = new Date();
    
    if (reportType === 'daily') {
      startDate.setDate(now.getDate() - 7);
    } else if (reportType === 'weekly') {
      startDate.setDate(now.getDate() - 30);
    } else {
      startDate.setMonth(now.getMonth() - 12);
    }

    const filteredOrders = orders.filter(o => {
      const createdAt = new Date(o.createdAt);
      return createdAt >= startDate && o.status === 'completed';
    });

    const data = {};
    filteredOrders.forEach(o => {
      const date = new Date(o.createdAt);
      let key;
      if (reportType === 'daily') {
        key = date.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
      } else if (reportType === 'weekly') {
        const weekNum = Math.ceil(date.getDate() / 7);
        key = `Minggu ${weekNum}`;
      } else {
        key = date.toLocaleString('id-ID', { month: 'long' });
      }
      if (!data[key]) {
        data[key] = { total: 0, count: 0 };
      }
      data[key].total += o.totalPrice;
      data[key].count += 1;
    });

    const labels = Object.keys(data);
    const values = labels.map(k => data[k].total);
    const counts = labels.map(k => data[k].count);
    const totalRevenueSum = values.reduce((a, b) => a + b, 0);
    const totalOrdersSum = counts.reduce((a, b) => a + b, 0);

    setReportData({ 
      labels, 
      values, 
      counts, 
      totalRevenue: totalRevenueSum, 
      totalOrders: totalOrdersSum 
    });
  };

  useEffect(() => {
    if (orders.length > 0) {
      generateReport();
    }
  }, [reportType, orders]);

  // ===== EXPORT PDF =====
  const exportPDF = async () => {
    if (!reportData.labels || reportData.labels.length === 0) {
      toast.error('⚠️ Tidak ada data untuk di-export!');
      return;
    }

    try {
      const element = reportRef.current;
      const canvas = await html2canvas(element, { scale: 2, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('l', 'mm', 'a4');
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      pdf.addImage(imgData, 'PNG', 5, 5, imgWidth, imgHeight);
      pdf.save(`laporan_penjualan_${new Date().toISOString().slice(0,10)}.pdf`);
      toast.success('✅ PDF berhasil di-export!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('❌ Gagal export PDF!');
    }
  };

  // ===== EXPORT EXCEL LAPORAN =====
  const exportReportExcel = () => {
    if (!reportData.labels || reportData.labels.length === 0) {
      toast.error('⚠️ Tidak ada data untuk di-export!');
      return;
    }

    try {
      const excelData = reportData.labels.map((label, i) => ({
        'Periode': label,
        'Total Pendapatan': reportData.values[i],
        'Jumlah Pesanan': reportData.counts[i]
      }));

      excelData.push({
        'Periode': '📊 TOTAL',
        'Total Pendapatan': reportData.totalRevenue,
        'Jumlah Pesanan': reportData.totalOrders
      });

      const wb = XLSX.utils.book_new();
      const ws = XLSX.utils.json_to_sheet(excelData);
      ws['!cols'] = [{ wch: 20 }, { wch: 25 }, { wch: 20 }];
      XLSX.utils.book_append_sheet(wb, ws, 'Laporan Penjualan');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(data, `laporan_penjualan_${new Date().toISOString().slice(0,10)}.xlsx`);
      toast.success('✅ Excel berhasil di-export!');
    } catch (error) {
      console.error('Error exporting Excel:', error);
      toast.error('❌ Gagal export Excel!');
    }
  };

  // ===== HAPUS SEMUA PESANAN =====
  const deleteAllOrders = () => {
    if (orders.length === 0) {
      toast.error('⚠️ Tidak ada pesanan untuk dihapus!');
      return;
    }

    if (!confirm(`⚠️ Hapus SEMUA pesanan (${orders.length})?`)) return;

    const userInput = prompt('Ketik "HAPUS" untuk konfirmasi:');
    if (userInput && userInput.toUpperCase() === 'HAPUS') {
      localStorage.removeItem('orders');
      setOrders([]);
      toast.success(`✅ Semua pesanan (${orders.length}) berhasil dihapus!`);
    } else {
      toast.error('❌ Penghapusan dibatalkan');
    }
  };

  // ===== HAPUS PESANAN PER USER =====
  const deleteOrdersByUser = (userId, userName) => {
    const userOrders = orders.filter(o => o.userId === userId);
    if (userOrders.length === 0) {
      toast.info(`ℹ️ Tidak ada pesanan dari user "${userName}"`);
      return;
    }

    if (!confirm(`⚠️ Hapus SEMUA pesanan dari user "${userName}" (${userOrders.length} pesanan)?`)) return;

    const remainingOrders = orders.filter(o => o.userId !== userId);
    localStorage.setItem('orders', JSON.stringify(remainingOrders));
    setOrders(remainingOrders);
    toast.success(`✅ Semua pesanan dari user "${userName}" berhasil dihapus!`);
  };

  // ===== HAPUS USER =====
  const deleteUser = async (userId, userName) => {
    if (!confirm(`Hapus user "${userName}"?`)) return;

    try {
      await userAPI.delete(userId);
      toast.success(`✅ User "${userName}" berhasil dihapus`);
      loadData(); // Refresh data
    } catch (error) {
      // Fallback ke localStorage
      const updatedUsers = users.filter(u => u.id !== userId);
      localStorage.setItem('users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      toast.success(`✅ User "${userName}" berhasil dihapus (localStorage)`);
    }
  };

  // ===== EXPORT ORDERS TO EXCEL =====
  const exportOrdersToExcel = () => {
    if (orders.length === 0) {
      toast.error('⚠️ Belum ada data pesanan untuk di-export!');
      return;
    }

    try {
      const orderData = [];
      let rowNumber = 0;

      orders.forEach((order) => {
        if (order.items && order.items.length > 0) {
          order.items.forEach((item, idx) => {
            rowNumber++;
            orderData.push({
              'No': rowNumber,
              'Order #': idx === 0 ? order.orderNumber || '-' : '',
              'User': idx === 0 ? (order.userName || '-') : '',
              'Items': `${item.name} (${item.quantity}x)`,
              'Harga per Item': item.price || 0,
              'Subtotal': item.price * item.quantity || 0,
              'Status': idx === 0 ? getStatusLabel(order.status) : '',
              'Metode Bayar': idx === 0 ? (order.paymentMethod || '-') : '',
              'Alamat': idx === 0 ? (order.deliveryAddress || '-') : '',
              'Tanggal': idx === 0 ? (order.createdAt ? formatDate(order.createdAt) : '-') : ''
            });
          });
        } else {
          rowNumber++;
          orderData.push({
            'No': rowNumber,
            'Order #': order.orderNumber || '-',
            'User': order.userName || '-',
            'Items': '-',
            'Harga per Item': 0,
            'Subtotal': 0,
            'Status': getStatusLabel(order.status),
            'Metode Bayar': order.paymentMethod || '-',
            'Alamat': order.deliveryAddress || '-',
            'Tanggal': order.createdAt ? formatDate(order.createdAt) : '-'
          });
        }
      });

      const grandTotal = orders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);
      const totalItems = orders.reduce((sum, o) => sum + (o.items ? o.items.reduce((s, i) => s + i.quantity, 0) : 0), 0);
      const completedOrders = orders.filter(o => o.status === 'completed').length;
      const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
      const cookingOrders = orders.filter(o => o.status === 'cooking').length;
      const readyOrders = orders.filter(o => o.status === 'ready').length;

      orderData.push({
        'No': '',
        'Order #': '📊 GRAND TOTAL',
        'User': '',
        'Items': `Total Item Terjual: ${totalItems} | Total Pesanan: ${orders.length}`,
        'Harga per Item': '',
        'Subtotal': grandTotal,
        'Status': `Selesai: ${completedOrders} | Pending: ${pendingOrdersCount} | Dimasak: ${cookingOrders} | Siap: ${readyOrders}`,
        'Metode Bayar': '',
        'Alamat': '',
        'Tanggal': ''
      });

      const wb = XLSX.utils.book_new();

      const wsOrders = XLSX.utils.json_to_sheet(orderData);
      wsOrders['!cols'] = [
        { wch: 5 }, { wch: 18 }, { wch: 20 }, { wch: 30 },
        { wch: 18 }, { wch: 18 }, { wch: 20 }, { wch: 18 },
        { wch: 30 }, { wch: 25 }
      ];

      XLSX.utils.book_append_sheet(wb, wsOrders, 'Data Pesanan');

      const summaryData = [
        { 'Keterangan': '📊 Total Pesanan', 'Jumlah': orders.length },
        { 'Keterangan': '📦 Total Item Terjual', 'Jumlah': totalItems },
        { 'Keterangan': '✅ Pesanan Selesai', 'Jumlah': completedOrders },
        { 'Keterangan': '⏳ Pesanan Pending', 'Jumlah': pendingOrdersCount },
        { 'Keterangan': '👨‍🍳 Pesanan Dimasak', 'Jumlah': cookingOrders },
        { 'Keterangan': '🍽️ Pesanan Siap Diambil', 'Jumlah': readyOrders },
        { 'Keterangan': '💰 Total Pendapatan', 'Jumlah': formatRupiah(grandTotal) }
      ];

      const wsSummary = XLSX.utils.json_to_sheet(summaryData);
      wsSummary['!cols'] = [{ wch: 28 }, { wch: 22 }];
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Rekap Total');

      const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
      const data = new Blob([excelBuffer], { type: 'application/octet-stream' });
      saveAs(data, `Data_Pesanan_${new Date().toISOString().slice(0,10)}.xlsx`);
      
      toast.success(`✅ Export berhasil!\n📊 Total: ${orders.length} pesanan`);
    } catch (error) {
      console.error('Error exporting:', error);
      toast.error('❌ Gagal export data. Silakan coba lagi.');
    }
  };

  // ===== LOADING STATE =====
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-pink-500 border-t-transparent mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">Memuat data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">📊 Dashboard Admin</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Selamat datang, <span className="font-semibold text-pink-500">{user?.name}</span>!
          </p>
        </div>
        <button
          onClick={exportOrdersToExcel}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-xl hover:scale-[1.02] transition-all duration-300 text-sm font-medium"
        >
          <FaFileExcel /> Export Excel 📊
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pesanan</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-500">
              <FaShoppingBag />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total User</p>
              <p className="text-2xl font-bold text-gray-800 dark:text-white">{totalUsers}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-500">
              <FaUsers />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
              <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                {formatRupiah(totalRevenue)}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-purple-500">
              <FaChartBar />
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pesanan Pending</p>
              <p className="text-2xl font-bold text-yellow-500">{pendingOrders}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-500">
              <FaUtensils />
            </div>
          </div>
        </div>
      </div>

      {/* ===== LAPORAN PENJUALAN ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">📈 Laporan Penjualan</h2>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setReportType('daily')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                reportType === 'daily' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FaChartBar className="inline mr-1" /> Harian
            </button>
            <button
              onClick={() => setReportType('weekly')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                reportType === 'weekly' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FaChartLine className="inline mr-1" /> Mingguan
            </button>
            <button
              onClick={() => setReportType('monthly')}
              className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                reportType === 'monthly' 
                  ? 'bg-pink-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <FaChartPie className="inline mr-1" /> Bulanan
            </button>
          </div>
        </div>

        <div className="p-4" ref={reportRef}>
          {reportData.labels && reportData.labels.length > 0 ? (
            <>
              <div className="space-y-3">
                {reportData.labels.map((label, i) => {
                  const maxValue = Math.max(...reportData.values);
                  const percentage = maxValue > 0 ? (reportData.values[i] / maxValue) * 100 : 0;
                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-300">{label}</span>
                        <span className="font-medium text-gray-800 dark:text-white">
                          {formatRupiah(reportData.values[i])} ({reportData.counts[i]} pesanan)
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-4 mt-1">
                        <div 
                          className={`h-4 rounded-full transition-all duration-500 ${
                            i % 3 === 0 ? 'bg-gradient-to-r from-pink-500 to-pink-400' :
                            i % 3 === 1 ? 'bg-gradient-to-r from-purple-500 to-purple-400' :
                            'bg-gradient-to-r from-blue-500 to-cyan-400'
                          }`}
                          style={{ width: `${Math.max(5, percentage)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400">
                    {formatRupiah(reportData.totalRevenue || 0)}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    {reportData.totalOrders || 0} pesanan selesai
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={exportPDF}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors text-sm"
                  >
                    <FaFilePdf /> PDF
                  </button>
                  <button
                    onClick={exportReportExcel}
                    className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-colors text-sm"
                  >
                    <FaFileExcel /> Excel
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p>Belum ada data penjualan untuk ditampilkan</p>
              <p className="text-sm mt-1">Pastikan ada pesanan yang sudah selesai</p>
            </div>
          )}
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">👥 Daftar User</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">({totalUsers} user)</span>
          <button
            onClick={loadData}
            className="ml-4 text-xs text-pink-500 hover:text-pink-600 transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 font-medium">Nama</th>
                <th className="pb-2 font-medium">Email</th>
                <th className="pb-2 font-medium">Role</th>
                <th className="pb-2 font-medium">Tanggal Daftar</th>
                <th className="pb-2 font-medium text-center">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Belum ada user terdaftar
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 text-gray-800 dark:text-white font-medium">{u.name}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{u.email}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        u.role === 'admin' 
                          ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400' 
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                      }`}>
                        {u.role === 'admin' ? '👑 Admin' : 'User'}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{formatDate(u.created_at)}</td>
                    <td className="py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {u.role !== 'admin' && (
                          <>
                            <button
                              onClick={() => deleteOrdersByUser(u.id, u.name)}
                              className="text-yellow-500 hover:text-yellow-700 transition-colors text-xs"
                              title={`Hapus pesanan ${u.name}`}
                            >
                              <FaUserTimes />
                            </button>
                            <button
                              onClick={() => deleteUser(u.id, u.name)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              title="Hapus user"
                            >
                              <FaTrash />
                            </button>
                          </>
                        )}
                        {u.role === 'admin' && (
                          <span className="text-gray-400 text-xs">(Protected)</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">📦 Daftar Pesanan</h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">({totalOrders} pesanan)</span>
          </div>
          <button
            onClick={deleteAllOrders}
            className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors text-sm"
          >
            <FaTrash /> Hapus Semua
          </button>
        </div>
        <div className="overflow-x-auto p-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <th className="pb-2 font-medium">Order #</th>
                <th className="pb-2 font-medium">User</th>
                <th className="pb-2 font-medium">Items</th>
                <th className="pb-2 font-medium">Total</th>
                <th className="pb-2 font-medium">Status</th>
                <th className="pb-2 font-medium">Tanggal</th>
              </tr>
            </thead>
            <tbody>
              {orders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-gray-500 dark:text-gray-400">
                    Belum ada pesanan
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="py-3 text-pink-600 dark:text-pink-400 font-medium">{order.orderNumber}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">{order.userName || '-'}</td>
                    <td className="py-3 text-gray-600 dark:text-gray-400">
                      {order.items ? order.items.map(i => i.name).join(', ') : '-'}
                    </td>
                    <td className="py-3 font-semibold text-gray-800 dark:text-white">{formatRupiah(order.totalPrice)}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        order.status === 'pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400' :
                        order.status === 'cooking' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' :
                        order.status === 'ready' ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' :
                        'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400'
                      }`}>
                        {getStatusLabel(order.status)}
                      </span>
                    </td>
                    <td className="py-3 text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;