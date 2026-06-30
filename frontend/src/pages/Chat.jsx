import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { chatAPI } from '../services/api';
import { FaPaperPlane, FaRobot, FaTimes, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';

const Chat = () => {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAdmin] = useState(user?.role === 'admin');
  const [selectedUser, setSelectedUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  // ===== LOAD USERS UNTUK ADMIN =====
  useEffect(() => {
    const loadUsers = async () => {
      if (isAdmin) {
        try {
          const response = await fetch('http://localhost:5000/api/users');
          const data = await response.json();
          const filteredUsers = data.filter(u => u.id !== user.id && u.role !== 'admin');
          setUsers(filteredUsers);
        } catch (error) {
          console.error('Error loading users:', error);
          // Fallback ke localStorage
          const allUsers = JSON.parse(localStorage.getItem('users') || '[]');
          const filtered = allUsers.filter(u => u.id !== user.id && u.role !== 'admin');
          setUsers(filtered);
        }
      }
    };
    loadUsers();
  }, [isAdmin, user]);

  // ===== LOAD MESSAGES =====
  useEffect(() => {
    if (user) {
      loadMessages();
    }
  }, [user, selectedUser]);

  const loadMessages = async () => {
    setLoading(true);
    try {
      let data;
      if (isAdmin && selectedUser) {
        // Admin: ambil chat dengan user tertentu
        data = await chatAPI.getAll(selectedUser.id, user.id);
      } else if (!isAdmin) {
        // User: ambil semua chat dengan admin
        data = await chatAPI.getAll(user.id, null);
      } else {
        // Admin belum pilih user
        setMessages([]);
        setLoading(false);
        return;
      }
      
      setMessages(data || []);
      console.log('✅ Messages loaded:', data?.length || 0);
    } catch (error) {
      console.error('❌ Error loading messages:', error);
      // Fallback ke localStorage
      const savedMessages = localStorage.getItem('chat_messages');
      if (savedMessages) {
        const allMessages = JSON.parse(savedMessages);
        if (isAdmin && selectedUser) {
          const filtered = allMessages.filter(msg => 
            (msg.senderId === selectedUser.id && msg.receiverId === user.id) ||
            (msg.senderId === user.id && msg.receiverId === selectedUser.id)
          );
          setMessages(filtered);
        } else if (!isAdmin) {
          const filtered = allMessages.filter(msg => 
            msg.senderId === user.id || msg.receiverId === user.id
          );
          setMessages(filtered);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // ===== FUNGSI KIRIM PESAN =====
  const sendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('⚠️ Pesan tidak boleh kosong!');
      return;
    }

    if (isAdmin && !selectedUser) {
      toast.error('⚠️ Pilih pelanggan terlebih dahulu!');
      return;
    }

    const receiverId = isAdmin ? selectedUser.id : 'admin-001'; // ID admin default

    const messageData = {
      id: 'chat-' + Date.now(),
      sender_id: user.id,
      receiver_id: receiverId,
      message: newMessage,
      is_read: false
    };

    try {
      // ===== KIRIM KE DATABASE =====
      await chatAPI.send(messageData);
      
      // ===== UPDATE STATE =====
      const newMsg = {
        id: messageData.id,
        senderId: user.id,
        senderName: user.name,
        senderRole: user.role,
        text: newMessage,
        timestamp: new Date().toISOString(),
        receiverId: receiverId,
        isRead: false
      };
      
      setMessages(prev => [...prev, newMsg]);
      setNewMessage('');
      
      // Backup ke localStorage
      const savedMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      savedMessages.push(newMsg);
      localStorage.setItem('chat_messages', JSON.stringify(savedMessages));
      
    } catch (error) {
      console.error('❌ Error sending message:', error);
      toast.error('Gagal mengirim pesan.');
    }
  };

  // ===== FUNGSI HAPUS PESAN =====
  const deleteMessage = async (messageId) => {
    const messageToDelete = messages.find(msg => msg.id === messageId);
    if (!messageToDelete) return;

    if (messageToDelete.senderId !== user.id) {
      toast.error('❌ Anda tidak bisa menghapus pesan orang lain!');
      return;
    }

    if (!confirm('Hapus pesan ini?')) return;

    try {
      await chatAPI.delete(messageId);
      
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Update localStorage
      const savedMessages = JSON.parse(localStorage.getItem('chat_messages') || '[]');
      const updated = savedMessages.filter(msg => msg.id !== messageId);
      localStorage.setItem('chat_messages', JSON.stringify(updated));
      
      toast.success('🗑️ Pesan berhasil dihapus!');
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      // Fallback
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      toast.success('🗑️ Pesan berhasil dihapus (lokal)');
    }
  };

  // ===== FUNGSI HAPUS SEMUA PESAN (Admin Only) =====
  const deleteAllMessages = async () => {
    if (!isAdmin) {
      toast.error('❌ Hanya admin yang bisa menghapus semua pesan!');
      return;
    }

    if (messages.length === 0) {
      toast.info('ℹ️ Tidak ada pesan untuk dihapus');
      return;
    }

    if (!confirm(`⚠️ Hapus SEMUA pesan (${messages.length} pesanan)?`)) return;

    const userInput = prompt('Ketik "HAPUS" untuk konfirmasi:');
    if (userInput && userInput.toUpperCase() === 'HAPUS') {
      try {
        await chatAPI.deleteAll();
        setMessages([]);
        localStorage.removeItem('chat_messages');
        toast.success(`✅ Semua pesan (${messages.length}) berhasil dihapus!`);
      } catch (error) {
        console.error('Error deleting all messages:', error);
        setMessages([]);
        localStorage.removeItem('chat_messages');
        toast.success(`✅ Semua pesan berhasil dihapus (lokal)`);
      }
    } else {
      toast.error('❌ Penghapusan dibatalkan');
    }
  };

  // ===== FILTER MESSAGES UNTUK ADMIN =====
  const filteredMessages = messages;

  // ===== LOADING =====
  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-4 border-pink-500 border-t-transparent mx-auto"></div>
          <p className="mt-3 text-gray-500 dark:text-gray-400">Memuat chat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-200px)] flex gap-4">
      {/* ===== SIDEBAR USER LIST UNTUK ADMIN ===== */}
      {isAdmin && (
        <div className="w-64 bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold">👥 Pelanggan</h3>
                <p className="text-white/70 text-xs">{users.length} user</p>
              </div>
              {messages.length > 0 && (
                <button
                  onClick={deleteAllMessages}
                  className="text-xs text-white/80 hover:text-white bg-white/20 px-2 py-1 rounded-lg transition-colors"
                  title="Hapus semua pesan"
                >
                  <FaTrash className="text-sm" />
                </button>
              )}
            </div>
          </div>
          <div className="overflow-y-auto h-[calc(100%-60px)]">
            {users.length === 0 ? (
              <p className="text-center text-gray-400 dark:text-gray-500 p-4 text-sm">
                Belum ada pelanggan terdaftar
              </p>
            ) : (
              users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                    selectedUser?.id === u.id ? 'bg-pink-50 dark:bg-pink-900/20 border-r-4 border-pink-500' : ''
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{u.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{u.email}</p>
                  </div>
                  {selectedUser?.id === u.id && (
                    <span className="text-xs bg-pink-500 text-white px-2 py-0.5 rounded-full">Active</span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ===== CHAT AREA ===== */}
      <div className="flex-1 bg-white dark:bg-gray-800 rounded-2xl shadow-md flex flex-col overflow-hidden">
        {/* Chat Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-pink-500 to-purple-600">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isAdmin && selectedUser ? (
                <>
                  <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-lg font-bold">
                    {selectedUser.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-white font-bold">{selectedUser.name}</h3>
                    <p className="text-white/70 text-xs">Online</p>
                  </div>
                </>
              ) : !isAdmin ? (
                <>
                  <FaRobot className="text-white text-3xl" />
                  <div>
                    <h3 className="text-white font-bold">Admin</h3>
                    <p className="text-white/70 text-xs">Online</p>
                  </div>
                </>
              ) : (
                <div>
                  <h3 className="text-white font-bold">Pilih Pelanggan</h3>
                  <p className="text-white/70 text-xs">Klik user di samping untuk mulai chat</p>
                </div>
              )}
            </div>
            {isAdmin && selectedUser && (
              <button 
                onClick={() => setSelectedUser(null)} 
                className="text-white hover:text-white/80 transition-colors"
              >
                <FaTimes />
              </button>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredMessages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500">
              <FaPaperPlane className="text-4xl mb-2 opacity-50" />
              <p>Belum ada pesan</p>
              <p className="text-sm">
                {isAdmin && !selectedUser 
                  ? 'Pilih pelanggan untuk mulai chat' 
                  : 'Mulai chat sekarang!'}
              </p>
            </div>
          ) : (
            filteredMessages.map((msg) => {
              const isOwn = msg.senderId === user.id;
              return (
                <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}>
                  <div className={`max-w-[70%] px-4 py-2 rounded-xl relative ${
                    isOwn 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white'
                  }`}>
                    <p className="text-sm break-words">{msg.text}</p>
                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-400 dark:text-gray-500'}`}>
                      {msg.senderName} • {new Date(msg.timestamp).toLocaleTimeString()}
                    </p>
                    
                    {/* ===== TOMBOL HAPUS (HANYA UNTUK PESAN SENDIRI) ===== */}
                    {isOwn && (
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="absolute -top-2 -right-2 p-1.5 rounded-full bg-red-500 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:scale-110"
                        title="Hapus pesan"
                      >
                        <FaTrash className="text-xs" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {(isAdmin ? selectedUser : true) && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                placeholder={
                  isAdmin && !selectedUser 
                    ? 'Pilih pelanggan terlebih dahulu' 
                    : 'Ketik pesan...'
                }
                disabled={isAdmin && !selectedUser}
                className="flex-1 px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:border-pink-500 text-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <button
                onClick={sendMessage}
                disabled={isAdmin && !selectedUser}
                className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl hover:shadow-xl transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaPaperPlane />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;