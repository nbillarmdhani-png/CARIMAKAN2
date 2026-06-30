import { useState } from 'react';
import { useVoucher } from '../context/VoucherContext';
import { useAuth } from '../context/AuthContext';
import { FaTag, FaPlus, FaTrash, FaTicketAlt, FaCopy } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Voucher = () => {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';
  const { vouchers, createVoucher, deleteVoucher, applyVoucher, setAppliedVoucher } = useVoucher();
  const [voucherCode, setVoucherCode] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [appliedCode, setAppliedCode] = useState(null);
  const [newVoucher, setNewVoucher] = useState({
    code: '',
    discount: 10,
    type: 'percentage',
    expiresAt: '',
    maxUses: 100
  });

  const formatRupiah = (price) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  };

  const handleApplyVoucher = () => {
    if (!voucherCode.trim()) {
      toast.error('⚠️ Masukkan kode voucher!');
      return;
    }

    // Cek apakah voucher sudah pernah dipakai
    if (appliedCode === voucherCode.toUpperCase()) {
      toast.warning('⚠️ Voucher sudah digunakan!');
      return;
    }

    const result = applyVoucher(voucherCode, 100000);
    if (result.valid) {
      setAppliedCode(voucherCode.toUpperCase());
      toast.success(`✅ Voucher berhasil! Potongan ${formatRupiah(result.discountAmount)}`);
      setVoucherCode('');
    } else {
      toast.error(`❌ ${result.message}`);
    }
  };

  const handleRemoveVoucher = () => {
    setAppliedVoucher(null);
    setAppliedCode(null);
    toast.info('🗑️ Voucher dihapus');
  };

  const handleCreateVoucher = () => {
    if (!newVoucher.code.trim()) {
      toast.error('⚠️ Masukkan kode voucher!');
      return;
    }
    if (!newVoucher.expiresAt) {
      toast.error('⚠️ Pilih tanggal kadaluarsa!');
      return;
    }
    createVoucher(
      newVoucher.code,
      newVoucher.discount,
      newVoucher.type,
      newVoucher.expiresAt,
      newVoucher.maxUses
    );
    setShowCreateForm(false);
    setNewVoucher({ code: '', discount: 10, type: 'percentage', expiresAt: '', maxUses: 100 });
    toast.success('✅ Voucher berhasil dibuat!');
  };

  const copyToClipboard = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('📋 Kode voucher disalin!');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">🎫 Voucher & Diskon</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {vouchers.length} voucher tersedia
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
          >
            <FaPlus /> Buat Voucher
          </button>
        )}
      </div>

      {/* ===== INPUT VOUCHER UNTUK SEMUA USER (TERMASUK USER BIASA) ===== */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
        <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">🎫 Punya Kode Voucher?</h3>
        
        {/* Tampilkan voucher yang sedang aktif */}
        {appliedCode && (
          <div className="mb-3 p-3 bg-green-50 dark:bg-green-900/30 rounded-xl border border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  ✅ Voucher <span className="font-bold">{appliedCode}</span> aktif!
                </p>
                <p className="text-xs text-green-500 dark:text-green-400 mt-1">
                  Potongan akan berlaku saat checkout
                </p>
              </div>
              <button
                onClick={handleRemoveVoucher}
                className="px-3 py-1 text-sm text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                Hapus
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          <input
            type="text"
            value={voucherCode}
            onChange={(e) => setVoucherCode(e.target.value.toUpperCase())}
            placeholder="Masukkan kode voucher..."
            className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
            disabled={!!appliedCode}
          />
          <button
            onClick={handleApplyVoucher}
            disabled={!!appliedCode}
            className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Pakai Voucher
          </button>
        </div>
      </div>

      {/* ===== FORM BUAT VOUCHER (ADMIN ONLY) ===== */}
      {showCreateForm && isAdmin && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-md">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-4">📝 Buat Voucher Baru</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kode Voucher
              </label>
              <input
                type="text"
                value={newVoucher.code}
                onChange={(e) => setNewVoucher({ ...newVoucher, code: e.target.value.toUpperCase() })}
                placeholder="CONTOH10"
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Diskon
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={newVoucher.discount}
                  onChange={(e) => setNewVoucher({ ...newVoucher, discount: parseFloat(e.target.value) })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
                />
                <select
                  value={newVoucher.type}
                  onChange={(e) => setNewVoucher({ ...newVoucher, type: e.target.value })}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
                >
                  <option value="percentage">%</option>
                  <option value="fixed">Rp</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kadaluarsa
              </label>
              <input
                type="date"
                value={newVoucher.expiresAt}
                onChange={(e) => setNewVoucher({ ...newVoucher, expiresAt: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Maksimal Penggunaan
              </label>
              <input
                type="number"
                value={newVoucher.maxUses}
                onChange={(e) => setNewVoucher({ ...newVoucher, maxUses: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleCreateVoucher}
              className="px-6 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300"
            >
              Simpan Voucher
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-6 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
            >
              Batal
            </button>
          </div>
        </div>
      )}

      {/* ===== DAFTAR VOUCHER ===== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {vouchers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-400 dark:text-gray-500">
            <FaTicketAlt className="text-4xl mx-auto mb-3 opacity-50" />
            <p>Belum ada voucher tersedia</p>
          </div>
        ) : (
          vouchers.map((voucher) => (
            <div
              key={voucher.id}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <FaTag className="text-pink-500" />
                    <span className="font-bold text-lg text-gray-800 dark:text-white">
                      {voucher.code}
                    </span>
                    {appliedCode === voucher.code && (
                      <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                  </div>
                  <p className="text-2xl font-bold text-pink-600 dark:text-pink-400 mt-1">
                    {voucher.type === 'percentage' ? `${voucher.discount}%` : formatRupiah(voucher.discount)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Kadaluarsa: {new Date(voucher.expiresAt).toLocaleDateString('id-ID')}
                  </p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">
                    Digunakan: {voucher.usedCount || 0}/{voucher.maxUses}
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => copyToClipboard(voucher.code)}
                    className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    title="Salin kode"
                  >
                    <FaCopy className="text-gray-600 dark:text-gray-300" />
                  </button>
                  {/* Tombol Pakai Voucher untuk User */}
                  {!isAdmin && appliedCode !== voucher.code && (
                    <button
                      onClick={() => {
                        setVoucherCode(voucher.code);
                        handleApplyVoucher();
                      }}
                      className="px-3 py-1 text-xs bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-lg hover:shadow-lg transition-all duration-300"
                    >
                      Pakai
                    </button>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => {
                        if (confirm('Hapus voucher ini?')) {
                          deleteVoucher(voucher.id);
                          toast.success('🗑️ Voucher dihapus');
                        }
                      }}
                      className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
                    >
                      <FaTrash className="text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Voucher;