import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';
import db from './config/database.js';
import serverless from 'serverless-http';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// ============================================================
// ===== TEST KONEKSI DATABASE =====
// ============================================================
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'OK', message: 'Database connected!', result: rows[0].result });
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// ============================================================
// ===== USERS API =====
// ============================================================

// Get all users (Admin only)
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, address, birth_date, bio, avatar, created_at FROM users'
    );
    res.json(rows);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
app.get('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role, phone, address, birth_date, bio, avatar, created_at FROM users WHERE id = ?',
      [id]
    );
    if (rows.length > 0) {
      res.json(rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Register
app.post('/api/register', async (req, res) => {
  const { id, name, email, password, role } = req.body;
  try {
    await db.query(
      'INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)',
      [id, name, email, password, role || 'user']
    );
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Email sudah terdaftar!' });
    } else {
      console.error('Register error:', error);
      res.status(500).json({ error: error.message });
    }
  }
});

// Login
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query(
      'SELECT id, name, email, role FROM users WHERE email = ? AND password = ?',
      [email, password]
    );
    if (rows.length > 0) {
      res.json({ success: true, user: rows[0] });
    } else {
      res.status(401).json({ error: 'Email atau password salah!' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user profile
app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, birth_date, bio, avatar } = req.body;
  try {
    await db.query(
      `UPDATE users SET 
        name = ?, email = ?, phone = ?, address = ?, 
        birth_date = ?, bio = ?, avatar = ? 
       WHERE id = ?`,
      [name, email, phone, address, birth_date, bio, avatar, id]
    );
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Change password
app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    if (rows[0].password !== oldPassword) {
      return res.status(400).json({ error: 'Password lama salah!' });
    }
    await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Hapus juga data terkait
    await db.query('DELETE FROM orders WHERE user_id = ?', [id]);
    await db.query('DELETE FROM wishlist WHERE user_id = ?', [id]);
    await db.query('DELETE FROM ratings WHERE user_id = ?', [id]);
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ===== ORDERS API =====
// ============================================================

// Get orders (Admin: all, User: own)
app.get('/api/orders', async (req, res) => {
  const { userId, role } = req.query;
  try {
    let query = 'SELECT * FROM orders';
    let params = [];
    if (role !== 'admin' && userId) {
      query += ' WHERE user_id = ?';
      params.push(userId);
    }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    const orders = rows.map(order => ({
      ...order,
      items: JSON.parse(order.items || '[]')
    }));
    res.json(orders);
  } catch (error) {
    console.error('Error fetching orders:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get order by ID
app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [id]);
    if (rows.length > 0) {
      const order = {
        ...rows[0],
        items: JSON.parse(rows[0].items || '[]')
      };
      res.json(order);
    } else {
      res.status(404).json({ error: 'Order not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create order
app.post('/api/orders', async (req, res) => {
  const { 
    id, user_id, order_number, items, total_price, 
    delivery_address, status, estimated_time, 
    voucher_code, voucher_discount 
  } = req.body;
  try {
    await db.query(
      `INSERT INTO orders 
       (id, user_id, order_number, items, total_price, delivery_address, status, estimated_time, voucher_code, voucher_discount) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, user_id, order_number, JSON.stringify(items), 
        total_price, delivery_address, status || 'pending', 
        estimated_time || 30, voucher_code || null, voucher_discount || 0
      ]
    );
    res.json({ success: true, message: 'Order created successfully' });
  } catch (error) {
    console.error('Error creating order:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update order status
app.put('/api/orders/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Process payment
app.put('/api/orders/:id/payment', async (req, res) => {
  const { id } = req.params;
  const { payment_method } = req.body;
  try {
    await db.query(
      'UPDATE orders SET payment_method = ?, payment_status = "paid", status = "cooking" WHERE id = ?',
      [payment_method, id]
    );
    res.json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete order
app.delete('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [id]);
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ===== WISHLIST API =====
// ============================================================

// Get wishlist by user
app.get('/api/wishlist/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM wishlist WHERE user_id = ?', [userId]);
    const wishlist = rows.map(item => ({
      ...item,
      meal_data: JSON.parse(item.meal_data || '{}')
    }));
    res.json(wishlist);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add to wishlist
app.post('/api/wishlist', async (req, res) => {
  const { id, user_id, meal_id, meal_data } = req.body;
  try {
    await db.query(
      'INSERT INTO wishlist (id, user_id, meal_id, meal_data) VALUES (?, ?, ?, ?)',
      [id, user_id, meal_id, JSON.stringify(meal_data)]
    );
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Already in wishlist' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Remove from wishlist
app.delete('/api/wishlist', async (req, res) => {
  const { user_id, meal_id } = req.query;
  try {
    await db.query('DELETE FROM wishlist WHERE user_id = ? AND meal_id = ?', [user_id, meal_id]);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ===== RATINGS API =====
// ============================================================

// Get ratings by meal
app.get('/api/ratings/:mealId', async (req, res) => {
  const { mealId } = req.params;
  try {
    const [rows] = await db.query('SELECT * FROM ratings WHERE meal_id = ? ORDER BY created_at DESC', [mealId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add rating
app.post('/api/ratings', async (req, res) => {
  const { id, meal_id, user_id, user_name, rating, comment } = req.body;
  try {
    await db.query(
      'INSERT INTO ratings (id, meal_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [id, meal_id, user_id, user_name, rating, comment]
    );
    res.json({ success: true, message: 'Rating added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete rating
app.delete('/api/ratings/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM ratings WHERE id = ?', [id]);
    res.json({ success: true, message: 'Rating deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ===== VOUCHERS API =====
// ============================================================

// Get all vouchers
app.get('/api/vouchers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vouchers ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create voucher
app.post('/api/vouchers', async (req, res) => {
  const { id, code, discount, type, expires_at, max_uses } = req.body;
  try {
    await db.query(
      'INSERT INTO vouchers (id, code, discount, type, expires_at, max_uses) VALUES (?, ?, ?, ?, ?, ?)',
      [id, code, discount, type, expires_at, max_uses || 100]
    );
    res.json({ success: true, message: 'Voucher created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      res.status(400).json({ error: 'Kode voucher sudah ada!' });
    } else {
      res.status(500).json({ error: error.message });
    }
  }
});

// Delete voucher
app.delete('/api/vouchers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM vouchers WHERE id = ?', [id]);
    res.json({ success: true, message: 'Voucher deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ===== CHATS API =====
// ============================================================

// Get chats
app.get('/api/chats', async (req, res) => {
  const { userId, receiverId } = req.query;
  try {
    let query = 'SELECT * FROM chats WHERE ';
    let params = [];
    if (userId && receiverId) {
      query += '(sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)';
      params = [userId, receiverId, receiverId, userId];
    } else if (userId) {
      query += 'sender_id = ? OR receiver_id = ?';
      params = [userId, userId];
    } else {
      query = 'SELECT * FROM chats';
      params = [];
    }
    query += ' ORDER BY created_at ASC';
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send chat
app.post('/api/chats', async (req, res) => {
  const { id, sender_id, receiver_id, message } = req.body;
  try {
    await db.query(
      'INSERT INTO chats (id, sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?, ?)',
      [id, sender_id, receiver_id, message, false]
    );
    res.json({ success: true, message: 'Chat sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark chat as read
app.put('/api/chats/read', async (req, res) => {
  const { userId, senderId } = req.query;
  try {
    await db.query(
      'UPDATE chats SET is_read = true WHERE receiver_id = ? AND sender_id = ?',
      [userId, senderId]
    );
    res.json({ success: true, message: 'Chats marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete chat
app.delete('/api/chats/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM chats WHERE id = ?', [id]);
    res.json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all chats
app.delete('/api/chats', async (req, res) => {
  try {
    await db.query('DELETE FROM chats');
    res.json({ success: true, message: 'All chats deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ===== MEALS API (TheMealDB) =====
// ============================================================

// Get meals from TheMealDB
app.get('/api/meals', async (req, res) => {
  try {
    const { search } = req.query;
    let url = 'https://www.themealdb.com/api/json/v1/1/search.php?s=';
    if (search) url += encodeURIComponent(search);
    const response = await axios.get(url);
    if (response.data.meals) {
      const meals = response.data.meals.map(meal => ({
        id: meal.idMeal,
        name: meal.strMeal,
        category: meal.strCategory || 'Unknown',
        area: meal.strArea || 'Unknown',
        image: meal.strMealThumb,
        instructions: meal.strInstructions || 'No instructions available',
        youtube: meal.strYoutube,
        source: meal.strSource,
        ingredients: Array.from({ length: 20 }, (_, i) => ({
          ingredient: meal[`strIngredient${i + 1}`],
          measure: meal[`strMeasure${i + 1}`]
        })).filter(item => item.ingredient && item.ingredient.trim() !== '')
      }));
      res.json(meals);
    } else {
      res.json([]);
    }
  } catch (error) {
    console.error('Error fetching meals:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get meal by ID from TheMealDB
app.get('/api/meals/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${id}`);
    if (response.data.meals) {
      const meal = response.data.meals[0];
      res.json({
        id: meal.idMeal,
        name: meal.strMeal,
        category: meal.strCategory || 'Unknown',
        area: meal.strArea || 'Unknown',
        image: meal.strMealThumb,
        instructions: meal.strInstructions || 'No instructions available',
        youtube: meal.strYoutube,
        source: meal.strSource,
        ingredients: Array.from({ length: 20 }, (_, i) => ({
          ingredient: meal[`strIngredient${i + 1}`],
          measure: meal[`strMeasure${i + 1}`]
        })).filter(item => item.ingredient && item.ingredient.trim() !== '')
      });
    } else {
      res.status(404).json({ error: 'Meal not found' });
    }
  } catch (error) {
    console.error('Error fetching meal:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================
// ===== EXPORT FOR NETLIFY FUNCTIONS =====
// ============================================================
export const handler = serverless(app, {
  basePath: '/.netlify/functions/server'
});

// Keep local dev server capability
if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📊 Database ready (PostgreSQL)`);
    console.log(`📋 API endpoints ready`);
  });
}