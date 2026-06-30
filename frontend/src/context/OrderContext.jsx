import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { orderAPI } from '../services/api';
import toast from 'react-hot-toast';

const OrderContext = createContext();

const toNumber = (value, fallback = 0) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
};

const getItems = (items) => {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    try {
      const parsed = JSON.parse(items);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
};

const calculateItemsTotal = (items) => {
  return getItems(items).reduce((sum, item) => {
    return sum + toNumber(item.price) * toNumber(item.quantity, 1);
  }, 0);
};

const normalizeOrder = (order, currentUser = null) => {
  const items = getItems(order.items);
  const totalPrice = toNumber(order.totalPrice ?? order.total_price, calculateItemsTotal(items));
  const voucherDiscount = toNumber(order.voucherDiscount ?? order.voucher_discount, 0);
  const createdAt = order.createdAt || order.created_at || new Date().toISOString();
  const orderNumber = order.orderNumber || order.order_number || order.id || '';
  const deliveryAddress = order.deliveryAddress || order.delivery_address || 'Tidak ada alamat';
  const estimatedTime = toNumber(order.estimatedTime ?? order.estimated_time, 30);
  const paymentMethod = order.paymentMethod || order.payment_method || '';
  const paymentStatus = order.paymentStatus || order.payment_status || 'unpaid';
  const voucherCode = order.voucherCode || order.voucher_code || null;
  const userId = order.userId || order.user_id || currentUser?.id;
  const userName = order.userName || order.user_name || currentUser?.name;
  const userEmail = order.userEmail || order.user_email || currentUser?.email;

  return {
    ...order,
    items,
    totalPrice,
    total_price: totalPrice,
    voucherDiscount,
    voucher_discount: voucherDiscount,
    createdAt,
    created_at: createdAt,
    orderNumber,
    order_number: orderNumber,
    deliveryAddress,
    delivery_address: deliveryAddress,
    estimatedTime,
    estimated_time: estimatedTime,
    paymentMethod,
    payment_method: paymentMethod || null,
    paymentStatus,
    payment_status: paymentStatus,
    voucherCode,
    voucher_code: voucherCode,
    userId,
    user_id: userId,
    userName,
    userEmail
  };
};

export const useOrder = () => {
  const context = useContext(OrderContext);
  if (!context) {
    throw new Error('useOrder must be used within a OrderProvider');
  }
  return context;
};

export const OrderProvider = ({ children }) => {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [currentOrder, setCurrentOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // ===== LOAD ORDERS DARI API =====
  useEffect(() => {
    if (user) {
      loadOrders();
    } else {
      setOrders([]);
      setLoading(false);
    }
  }, [user]);

  const loadOrders = async () => {
    setLoading(true);
    try {
      const role = user?.role || 'user';
      const userId = user?.id;
      const data = await orderAPI.getAll(userId, role);
      const normalizedOrders = data.map(order => normalizeOrder(order, user));
      setOrders(normalizedOrders);
      console.log('✅ Orders loaded from API:', data.length);
    } catch (error) {
      console.error('❌ Error loading orders:', error);
      // Fallback ke localStorage
      const saved = localStorage.getItem('orders');
      if (saved) {
        const allOrders = JSON.parse(saved).map(order => normalizeOrder(order, user));
        if (user?.role === 'admin') {
          setOrders(allOrders);
        } else {
          const userOrders = allOrders.filter(o => o.userId === user?.id);
          setOrders(userOrders);
        }
      }
      toast.error('Gagal memuat pesanan. Menggunakan data lokal.');
    } finally {
      setLoading(false);
    }
  };

  // ===== CREATE ORDER =====
  const createOrder = async (cartItems, totalPrice, deliveryAddress, voucherCode = null, voucherDiscount = 0) => {
    if (!user) {
      throw new Error('Silakan login terlebih dahulu!');
    }

    const newOrder = {
      id: 'ord-' + Date.now(),
      user_id: user.id,
      userName: user.name,
      userEmail: user.email,
      order_number: `ORD-${Date.now().toString().slice(-6)}`,
      items: cartItems.map(item => ({
        ...item,
        price: item.price || 0
      })),
      total_price: totalPrice || 0,
      delivery_address: deliveryAddress || 'Tidak ada alamat',
      status: 'pending',
      estimated_time: 30 + Math.floor(Math.random() * 20),
      voucher_code: voucherCode,
      voucher_discount: voucherDiscount
    };

    try {
      // ===== SIMPAN KE DATABASE =====
      const result = await orderAPI.create(newOrder);
      console.log('✅ Order created in database:', result);
      
      // ===== UPDATE STATE =====
      const orderWithId = {
        ...newOrder,
        id: newOrder.id,
        createdAt: new Date().toISOString()
      };
      const normalizedOrder = normalizeOrder(orderWithId, user);
      
      setOrders(prev => [normalizedOrder, ...prev]);
      setCurrentOrder(normalizedOrder);
      
      // Backup ke localStorage
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      allOrders.push({
        ...normalizedOrder,
        userId: user.id,
        userName: user.name
      });
      localStorage.setItem('orders', JSON.stringify(allOrders));
      
      return normalizedOrder;
    } catch (error) {
      console.error('❌ Error creating order:', error);
      
      // Fallback ke localStorage jika API error
      const orderWithId = {
        ...newOrder,
        id: newOrder.id,
        userId: user.id,
        userName: user.name,
        createdAt: new Date().toISOString()
      };
      const normalizedOrder = normalizeOrder(orderWithId, user);
      
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      allOrders.push(normalizedOrder);
      localStorage.setItem('orders', JSON.stringify(allOrders));
      
      setOrders(prev => [normalizedOrder, ...prev]);
      setCurrentOrder(normalizedOrder);
      
      toast.warning('⚠️ Pesanan disimpan di lokal (database error)');
      return normalizedOrder;
    }
  };

  // ===== PROCESS PAYMENT =====
  const processPayment = async (orderId, paymentMethod) => {
    try {
      await orderAPI.processPayment(orderId, paymentMethod);
      
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          const updated = {
            ...order,
            paymentMethod: paymentMethod,
            payment_method: paymentMethod,
            paymentStatus: 'paid',
            payment_status: 'paid',
            status: 'cooking'
          };
          return updated;
        }
        return order;
      }));
      
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(prev => ({
          ...prev,
          paymentMethod: paymentMethod,
          payment_method: paymentMethod,
          paymentStatus: 'paid',
          payment_status: 'paid',
          status: 'cooking'
        }));
      }
      
      // Update localStorage
      updateLocalStorage(orderId, {
        paymentMethod,
        payment_method: paymentMethod,
        paymentStatus: 'paid',
        payment_status: 'paid',
        status: 'cooking'
      });
      
      toast.success('💳 Pembayaran berhasil! Pesanan sedang dimasak.');
      return true;
    } catch (error) {
      console.error('❌ Error processing payment:', error);
      toast.error('Gagal memproses pembayaran.');
      return false;
    }
  };

  // ===== UPDATE ORDER STATUS =====
  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await orderAPI.updateStatus(orderId, newStatus);
      
      setOrders(prev => prev.map(order => {
        if (order.id === orderId) {
          return { ...order, status: newStatus };
        }
        return order;
      }));
      
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(prev => ({ ...prev, status: newStatus }));
      }
      
      updateLocalStorage(orderId, { status: newStatus });
      
      toast.success(`✅ Status pesanan diupdate menjadi "${newStatus}"`);
      return true;
    } catch (error) {
      console.error('❌ Error updating status:', error);
      toast.error('Gagal mengupdate status.');
      return false;
    }
  };

  // ===== DELETE ORDER =====
  const deleteOrder = async (orderId) => {
    try {
      await orderAPI.delete(orderId);
      
      setOrders(prev => prev.filter(order => order.id !== orderId));
      if (currentOrder && currentOrder.id === orderId) {
        setCurrentOrder(null);
      }
      
      // Update localStorage
      const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      const updatedOrders = allOrders.filter(o => o.id !== orderId);
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      
      toast.success('🗑️ Pesanan berhasil dihapus');
      return true;
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      toast.error('Gagal menghapus pesanan.');
      return false;
    }
  };

  // ===== UPDATE LOCAL STORAGE =====
  const updateLocalStorage = (orderId, updates) => {
    const allOrders = JSON.parse(localStorage.getItem('orders') || '[]');
    const updatedOrders = allOrders.map(order => {
      if (order.id === orderId) {
        return { ...order, ...updates };
      }
      return order;
    });
    localStorage.setItem('orders', JSON.stringify(updatedOrders));
  };

  // ===== GET ORDER BY ID =====
  const getOrder = (orderId) => {
    return orders.find(order => order.id === orderId);
  };

  const value = {
    orders,
    currentOrder,
    loading,
    createOrder,
    processPayment,
    updateOrderStatus,
    getOrder,
    deleteOrder,
    setCurrentOrder,
    loadOrders
  };

  return (
    <OrderContext.Provider value={value}>
      {children}
    </OrderContext.Provider>
  );
};
