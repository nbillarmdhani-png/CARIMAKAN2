import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import { ratingAPI } from '../services/api';
import toast from 'react-hot-toast';

const RatingContext = createContext();

export const useRating = () => {
  const context = useContext(RatingContext);
  if (!context) {
    throw new Error('useRating must be used within a RatingProvider');
  }
  return context;
};

export const RatingProvider = ({ children }) => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===== LOAD RATINGS DARI API =====
  const loadRatings = async (mealId) => {
    if (!mealId) return [];
    
    setLoading(true);
    try {
      const data = await ratingAPI.getByMeal(mealId);
      setRatings(data);
      console.log('✅ Ratings loaded from API:', data.length);
      return data;
    } catch (error) {
      console.error('❌ Error loading ratings:', error);
      // Fallback ke localStorage
      const saved = localStorage.getItem('ratings');
      if (saved) {
        const allRatings = JSON.parse(saved);
        const mealRatings = allRatings.filter(r => r.mealId === mealId);
        setRatings(mealRatings);
        return mealRatings;
      }
      setRatings([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // ===== ADD RATING =====
  const addRating = async (mealId, userId, userName, rating, comment) => {
    if (!user) {
      toast.error('⚠️ Silakan login terlebih dahulu!');
      return null;
    }

    const newRating = {
      id: 'rate-' + Date.now(),
      meal_id: mealId,
      user_id: userId,
      user_name: userName,
      rating: rating,
      comment: comment || ''
    };

    try {
      await ratingAPI.add(newRating);
      
      const formattedRating = {
        id: newRating.id,
        mealId: mealId,
        userId: userId,
        userName: userName,
        rating: rating,
        comment: comment || '',
        createdAt: new Date().toISOString()
      };
      
      setRatings(prev => [formattedRating, ...prev]);
      
      // Backup ke localStorage
      const saved = JSON.parse(localStorage.getItem('ratings') || '[]');
      saved.push(formattedRating);
      localStorage.setItem('ratings', JSON.stringify(saved));
      
      toast.success('⭐ Rating berhasil ditambahkan!');
      return formattedRating;
    } catch (error) {
      console.error('❌ Error adding rating:', error);
      // Fallback ke localStorage
      const formattedRating = {
        id: newRating.id,
        mealId: mealId,
        userId: userId,
        userName: userName,
        rating: rating,
        comment: comment || '',
        createdAt: new Date().toISOString()
      };
      
      setRatings(prev => [formattedRating, ...prev]);
      const saved = JSON.parse(localStorage.getItem('ratings') || '[]');
      saved.push(formattedRating);
      localStorage.setItem('ratings', JSON.stringify(saved));
      
      toast.warning('⚠️ Rating disimpan di lokal (database error)');
      return formattedRating;
    }
  };

  // ===== DELETE RATING =====
  const deleteRating = async (ratingId) => {
    try {
      await ratingAPI.delete(ratingId);
      
      setRatings(prev => prev.filter(r => r.id !== ratingId));
      
      // Backup ke localStorage
      const saved = JSON.parse(localStorage.getItem('ratings') || '[]');
      const updated = saved.filter(r => r.id !== ratingId);
      localStorage.setItem('ratings', JSON.stringify(updated));
      
      toast.success('🗑️ Rating berhasil dihapus');
      return true;
    } catch (error) {
      console.error('❌ Error deleting rating:', error);
      // Fallback ke localStorage
      setRatings(prev => prev.filter(r => r.id !== ratingId));
      const saved = JSON.parse(localStorage.getItem('ratings') || '[]');
      const updated = saved.filter(r => r.id !== ratingId);
      localStorage.setItem('ratings', JSON.stringify(updated));
      
      toast.success('🗑️ Rating berhasil dihapus (lokal)');
      return true;
    }
  };

  // ===== GET RATINGS BY MEAL =====
  const getRatingsByMeal = (mealId) => {
    return ratings.filter(r => r.mealId === mealId);
  };

  // ===== GET AVERAGE RATING =====
  const getAverageRating = (mealId) => {
    const mealRatings = ratings.filter(r => r.mealId === mealId);
    if (mealRatings.length === 0) return 0;
    const sum = mealRatings.reduce((acc, r) => acc + r.rating, 0);
    return parseFloat((sum / mealRatings.length).toFixed(1));
  };

  // ===== GET RATING COUNT =====
  const getRatingCount = (mealId) => {
    return ratings.filter(r => r.mealId === mealId).length;
  };

  // ===== GET USER RATING =====
  const getUserRating = (mealId, userId) => {
    if (!userId) return null;
    return ratings.find(r => r.mealId === mealId && r.userId === userId) || null;
  };

  // ===== LOAD RATINGS FOR A MEAL (dari FoodDetail) =====
  useEffect(() => {
    // Ini akan dipanggil dari FoodDetail
  }, []);

  const value = {
    ratings,
    loading,
    loadRatings,
    addRating,
    deleteRating,
    getRatingsByMeal,
    getAverageRating,
    getRatingCount,
    getUserRating
  };

  return (
    <RatingContext.Provider value={value}>
      {children}
    </RatingContext.Provider>
  );
};