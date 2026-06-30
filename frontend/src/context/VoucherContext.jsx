import React, { createContext, useContext, useState, useEffect } from 'react';
import { voucherAPI } from '../services/api';
import toast from 'react-hot-toast';

const VoucherContext = createContext();

export const useVoucher = () => {
  const context = useContext(VoucherContext);
  if (!context) {
    throw new Error('useVoucher must be used within a VoucherProvider');
  }
  return context;
};

export const VoucherProvider = ({ children }) => {
  const [vouchers, setVouchers] = useState([]);
  const [appliedVoucher, setAppliedVoucher] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== LOAD VOUCHERS DARI API =====
  useEffect(() => {
    loadVouchers();
  }, []);

  const loadVouchers = async () => {
    setLoading(true);
    try {
      const data = await voucherAPI.getAll();
      setVouchers(data);
      console.log('✅ Vouchers loaded from API:', data.length);
    } catch (error) {
      console.error('❌ Error loading vouchers:', error);
      // Fallback ke localStorage
      const saved = localStorage.getItem('vouchers');
      if (saved) {
        setVouchers(JSON.parse(saved));
      } else {
        // Data default jika belum ada
        const defaultVouchers = [
          {
            id: 'v1',
            code: 'DISKON10',
            discount: 10,
            type: 'percentage',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            max_uses: 100,
            used_count: 0,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'v2',
            code: 'DISKON20',
            discount: 20,
            type: 'percentage',
            expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            max_uses: 50,
            used_count: 0,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'v3',
            code: 'POTONGAN5',
            discount: 5000,
            type: 'fixed',
            expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            max_uses: 20,
            used_count: 0,
            is_active: true,
            created_at: new Date().toISOString()
          },
          {
            id: 'v4',
            code: 'GRATISONGKIR',
            discount: 15000,
            type: 'fixed',
            expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            max_uses: 10,
            used_count: 0,
            is_active: true,
            created_at: new Date().toISOString()
          }
        ];
        setVouchers(defaultVouchers);
        localStorage.setItem('vouchers', JSON.stringify(defaultVouchers));
      }
      toast.error('Gagal memuat voucher. Menggunakan data lokal.');
    } finally {
      setLoading(false);
    }
  };

  // ===== CREATE VOUCHER =====
  const createVoucher = async (code, discount, type, expiresAt, maxUses = 100) => {
    const newVoucher = {
      id: 'voucher-' + Date.now(),
      code: code.toUpperCase(),
      discount,
      type,
      expires_at: expiresAt,
      max_uses: maxUses || 100,
      used_count: 0,
      is_active: true
    };

    try {
      await voucherAPI.create(newVoucher);
      
      setVouchers(prev => [...prev, newVoucher]);
      
      // Backup ke localStorage
      const saved = JSON.parse(localStorage.getItem('vouchers') || '[]');
      saved.push(newVoucher);
      localStorage.setItem('vouchers', JSON.stringify(saved));
      
      toast.success('✅ Voucher berhasil dibuat!');
      return newVoucher;
    } catch (error) {
      console.error('❌ Error creating voucher:', error);
      // Fallback ke localStorage
      setVouchers(prev => [...prev, newVoucher]);
      const saved = JSON.parse(localStorage.getItem('vouchers') || '[]');
      saved.push(newVoucher);
      localStorage.setItem('vouchers', JSON.stringify(saved));
      toast.warning('⚠️ Voucher disimpan di lokal (database error)');
      return newVoucher;
    }
  };

  // ===== DELETE VOUCHER =====
  const deleteVoucher = async (voucherId) => {
    try {
      await voucherAPI.delete(voucherId);
      
      setVouchers(prev => prev.filter(v => v.id !== voucherId));
      
      // Backup ke localStorage
      const saved = JSON.parse(localStorage.getItem('vouchers') || '[]');
      const updated = saved.filter(v => v.id !== voucherId);
      localStorage.setItem('vouchers', JSON.stringify(updated));
      
      toast.success('🗑️ Voucher berhasil dihapus');
      return true;
    } catch (error) {
      console.error('❌ Error deleting voucher:', error);
      // Fallback ke localStorage
      setVouchers(prev => prev.filter(v => v.id !== voucherId));
      const saved = JSON.parse(localStorage.getItem('vouchers') || '[]');
      const updated = saved.filter(v => v.id !== voucherId);
      localStorage.setItem('vouchers', JSON.stringify(updated));
      toast.success('🗑️ Voucher berhasil dihapus (lokal)');
      return true;
    }
  };

  // ===== VALIDATE VOUCHER =====
  const validateVoucher = (code, totalPrice) => {
    const voucher = vouchers.find(v => v.code === code.toUpperCase() && v.is_active);
    if (!voucher) {
      return { valid: false, message: 'Voucher tidak ditemukan!' };
    }

    if (new Date(voucher.expires_at) < new Date()) {
      return { valid: false, message: 'Voucher sudah kadaluarsa!' };
    }

    if (voucher.used_count >= voucher.max_uses) {
      return { valid: false, message: 'Voucher sudah habis digunakan!' };
    }

    let discountAmount = 0;
    if (voucher.type === 'percentage') {
      discountAmount = (totalPrice * voucher.discount) / 100;
    } else {
      discountAmount = voucher.discount;
    }

    return { valid: true, voucher, discountAmount };
  };

  // ===== APPLY VOUCHER =====
  const applyVoucher = (code, totalPrice) => {
    const result = validateVoucher(code, totalPrice);
    if (result.valid) {
      setAppliedVoucher(result.voucher);
      toast.success(`✅ Voucher berhasil! Potongan ${result.discountAmount}`);
      return result;
    } else {
      toast.error(`❌ ${result.message}`);
      return result;
    }
  };

  // ===== USE VOUCHER (increment used count) =====
  const useVoucher = async (voucherId) => {
    // Update di state
    setVouchers(prev => prev.map(v => 
      v.id === voucherId ? { ...v, used_count: v.used_count + 1 } : v
    ));
    
    // Update di localStorage
    const saved = JSON.parse(localStorage.getItem('vouchers') || '[]');
    const updated = saved.map(v => 
      v.id === voucherId ? { ...v, used_count: v.used_count + 1 } : v
    );
    localStorage.setItem('vouchers', JSON.stringify(updated));
    
    // Clear applied voucher
    setAppliedVoucher(null);
  };

  const value = {
    vouchers,
    appliedVoucher,
    loading,
    createVoucher,
    validateVoucher,
    applyVoucher,
    useVoucher,
    deleteVoucher,
    setAppliedVoucher,
    loadVouchers
  };

  return (
    <VoucherContext.Provider value={value}>
      {children}
    </VoucherContext.Provider>
  );
};