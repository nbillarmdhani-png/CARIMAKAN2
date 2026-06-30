export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper untuk fetch
const fetchAPI = async (endpoint, options = {}) => {
  try {
    const response = await fetch(`${API_URL}${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || 'Terjadi kesalahan');
    }
    return data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

// ============================================================
// ===== USERS API =====
// ============================================================
export const userAPI = {
  register: (userData) => fetchAPI('/register', {
    method: 'POST',
    body: JSON.stringify(userData)
  }),
  
  login: (email, password) => fetchAPI('/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  
  getAll: () => fetchAPI('/users'),
  
  getById: (id) => fetchAPI(`/users/${id}`),
  
  update: (id, data) => fetchAPI(`/users/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  changePassword: (id, data) => fetchAPI(`/users/${id}/password`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  
  delete: (id) => fetchAPI(`/users/${id}`, {
    method: 'DELETE'
  })
};

// ============================================================
// ===== ORDERS API =====
// ============================================================
export const orderAPI = {
  getAll: (userId, role) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (role) params.append('role', role);
    return fetchAPI(`/orders?${params.toString()}`);
  },
  
  getById: (id) => fetchAPI(`/orders/${id}`),
  
  create: (orderData) => fetchAPI('/orders', {
    method: 'POST',
    body: JSON.stringify(orderData)
  }),
  
  updateStatus: (orderId, status) => fetchAPI(`/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  }),
  
  processPayment: (orderId, paymentMethod) => fetchAPI(`/orders/${orderId}/payment`, {
    method: 'PUT',
    body: JSON.stringify({ payment_method: paymentMethod })
  }),
  
  delete: (orderId) => fetchAPI(`/orders/${orderId}`, {
    method: 'DELETE'
  })
};

// ============================================================
// ===== WISHLIST API =====
// ============================================================
export const wishlistAPI = {
  getByUser: (userId) => fetchAPI(`/wishlist/${userId}`),
  
  add: (data) => fetchAPI('/wishlist', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  remove: (userId, mealId) => fetchAPI(`/wishlist?user_id=${userId}&meal_id=${mealId}`, {
    method: 'DELETE'
  })
};

// ============================================================
// ===== RATINGS API =====
// ============================================================
export const ratingAPI = {
  getByMeal: (mealId) => fetchAPI(`/ratings/${mealId}`),
  
  add: (data) => fetchAPI('/ratings', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  delete: (ratingId) => fetchAPI(`/ratings/${ratingId}`, {
    method: 'DELETE'
  })
};

// ============================================================
// ===== VOUCHERS API =====
// ============================================================
export const voucherAPI = {
  getAll: () => fetchAPI('/vouchers'),
  
  create: (data) => fetchAPI('/vouchers', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  delete: (voucherId) => fetchAPI(`/vouchers/${voucherId}`, {
    method: 'DELETE'
  })
};

// ============================================================
// ===== CHATS API =====
// ============================================================
export const chatAPI = {
  getAll: (userId, receiverId) => {
    const params = new URLSearchParams();
    if (userId) params.append('userId', userId);
    if (receiverId) params.append('receiverId', receiverId);
    return fetchAPI(`/chats?${params.toString()}`);
  },
  
  send: (data) => fetchAPI('/chats', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  
  markAsRead: (userId, senderId) => fetchAPI(`/chats/read?userId=${userId}&senderId=${senderId}`, {
    method: 'PUT'
  }),
  
  delete: (chatId) => fetchAPI(`/chats/${chatId}`, {
    method: 'DELETE'
  }),
  
  deleteAll: () => fetchAPI('/chats', {
    method: 'DELETE'
  })
};

// ============================================================
// ===== MEALS API (TheMealDB) =====
// ============================================================
export const mealAPI = {
  getAll: (search = '') => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    return fetchAPI(`/meals?${params.toString()}`);
  },
  
  getById: (id) => fetchAPI(`/meals/${id}`)
};

// ============================================================
// ===== EXPORT SEMUA =====
// ============================================================
export default {
  userAPI,
  orderAPI,
  wishlistAPI,
  ratingAPI,
  voucherAPI,
  chatAPI,
  mealAPI
};