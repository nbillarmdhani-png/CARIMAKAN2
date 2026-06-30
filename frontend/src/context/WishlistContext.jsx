import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { wishlistAPI } from '../services/api';
import toast from 'react-hot-toast';

const WishlistContext = createContext();

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};

export const WishlistProvider = ({ children }) => {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(true);

  // ===== LOAD WISHLIST DARI API =====
  useEffect(() => {
    if (user) {
      loadWishlist();
    } else {
      setWishlist([]);
      setLoading(false);
    }
  }, [user]);

  const loadWishlist = async () => {
    setLoading(true);
    try {
      const data = await wishlistAPI.getByUser(user.id);
      // Extract meal_data dari response
      const items = data.map(item => ({
        ...item.meal_data,
        wishlistId: item.id
      }));
      setWishlist(items);
      console.log('✅ Wishlist loaded from API:', items.length);
    } catch (error) {
      console.error('❌ Error loading wishlist:', error);
      // Fallback ke localStorage
      const saved = localStorage.getItem('wishlist');
      if (saved) {
        setWishlist(JSON.parse(saved));
      }
      toast.error('Gagal memuat favorit. Menggunakan data lokal.');
    } finally {
      setLoading(false);
    }
  };

  // ===== ADD TO WISHLIST =====
  const addToWishlist = async (meal) => {
    if (!user) {
      toast.error('⚠️ Silakan login terlebih dahulu!');
      return;
    }

    // Cek apakah sudah ada
    const exists = wishlist.some(item => item.id === meal.id);
    if (exists) {
      // Jika sudah ada, hapus (toggle)
      await removeFromWishlist(meal.id);
      return;
    }

    try {
      const data = {
        id: 'wish-' + Date.now(),
        user_id: user.id,
        meal_id: meal.id,
        meal_data: meal
      };

      await wishlistAPI.add(data);
      
      setWishlist(prev => [...prev, meal]);
      
      // Backup ke localStorage
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
      saved.push(meal);
      localStorage.setItem('wishlist', JSON.stringify(saved));
      
      console.log('✅ Added to wishlist:', meal.name);
    } catch (error) {
      console.error('❌ Error adding to wishlist:', error);
      // Fallback ke localStorage
      setWishlist(prev => [...prev, meal]);
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
      saved.push(meal);
      localStorage.setItem('wishlist', JSON.stringify(saved));
      toast.warning('⚠️ Favorit disimpan di lokal (database error)');
    }
  };

  // ===== REMOVE FROM WISHLIST =====
  const removeFromWishlist = async (mealId) => {
    try {
      await wishlistAPI.remove(user.id, mealId);
      
      setWishlist(prev => prev.filter(item => item.id !== mealId));
      
      // Backup ke localStorage
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const updated = saved.filter(item => item.id !== mealId);
      localStorage.setItem('wishlist', JSON.stringify(updated));
      
      console.log('✅ Removed from wishlist:', mealId);
    } catch (error) {
      console.error('❌ Error removing from wishlist:', error);
      // Fallback ke localStorage
      setWishlist(prev => prev.filter(item => item.id !== mealId));
      const saved = JSON.parse(localStorage.getItem('wishlist') || '[]');
      const updated = saved.filter(item => item.id !== mealId);
      localStorage.setItem('wishlist', JSON.stringify(updated));
    }
  };

  // ===== CHECK IF IN WISHLIST =====
  const isInWishlist = (mealId) => {
    return wishlist.some(item => item.id === mealId);
  };

  // ===== GET TOTAL WISHLIST =====
  const getTotalWishlist = () => {
    return wishlist.length;
  };

  const value = {
    wishlist,
    loading,
    addToWishlist,
    removeFromWishlist,
    isInWishlist,
    getTotalWishlist,
    loadWishlist
  };

  return (
    <WishlistContext.Provider value={value}>
      {children}
    </WishlistContext.Provider>
  );
};