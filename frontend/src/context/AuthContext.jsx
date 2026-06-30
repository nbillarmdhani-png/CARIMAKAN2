import React, { createContext, useContext, useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within a AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cek session di localStorage saat pertama kali load
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user:', error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  // ===== REGISTER =====
const register = async (name, email, password) => {
  if (!name || !email || !password) {
    throw new Error('Semua field wajib diisi!');
  }
  if (password.length < 6) {
    throw new Error('Password minimal 6 karakter!');
  }

  const userData = {
    id: 'user-' + Date.now(),
    name,
    email,
    password,
    role: 'user'
  };

  try {
    // ===== REGISTER KE DATABASE =====
    const result = await userAPI.register(userData);
    console.log('✅ Register success:', result);
    
    // ===== AUTO LOGIN =====
    const loginResult = await userAPI.login(email, password);
    console.log('✅ Auto login success:', loginResult);
    
    const userDataResult = {
      id: loginResult.user.id,
      name: loginResult.user.name,
      email: loginResult.user.email,
      role: loginResult.user.role
    };
    
    // Simpan ke localStorage untuk session
    localStorage.setItem('user', JSON.stringify(userDataResult));
    setUser(userDataResult);
    
    return userDataResult;
  } catch (error) {
    console.error('❌ Register error:', error);
    throw new Error(error.message || 'Gagal mendaftar');
  }
};
  // ===== LOGIN =====
  const login = async (email, password) => {
    if (!email || !password) {
      throw new Error('Email dan password wajib diisi!');
    }

    try {
      const result = await userAPI.login(email, password);
      const userData = {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role
      };
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);
      return userData;
    } catch (error) {
      throw new Error(error.message || 'Email atau password salah!');
    }
  };

  // ===== LOGOUT =====
  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
    toast.success('👋 Anda telah keluar');
  };

  // ===== UPDATE PROFILE =====
  const updateProfile = async (name, email, phone, address, birthDate, bio, avatar) => {
    if (!user) throw new Error('Silakan login terlebih dahulu!');
    
    try {
      await userAPI.update(user.id, { name, email, phone, address, birth_date: birthDate, bio, avatar });
      
      const updatedUser = { ...user, name, email, phone, address, birthDate, bio, avatar };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw new Error(error.message || 'Gagal update profil');
    }
  };

  // ===== CHANGE PASSWORD =====
  const changePassword = async (oldPassword, newPassword) => {
    if (!user) throw new Error('Silakan login terlebih dahulu!');
    
    try {
      await userAPI.changePassword(user.id, { oldPassword, newPassword });
      return true;
    } catch (error) {
      throw new Error(error.message || 'Gagal ganti password');
    }
  };

  // ===== UPLOAD AVATAR =====
  const uploadAvatar = async (avatarData) => {
    if (!user) throw new Error('Silakan login terlebih dahulu!');
    
    try {
      await userAPI.update(user.id, { avatar: avatarData });
      const updatedUser = { ...user, avatar: avatarData };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      throw new Error(error.message || 'Gagal upload foto');
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateProfile,
    changePassword,
    uploadAvatar,
    isAuthenticated,
    isAdmin
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};