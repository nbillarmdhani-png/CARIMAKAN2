import express from 'express';
import cors from 'cors';
import axios from 'axios';
import pg from 'pg';
import serverless from 'serverless-http';

const { Pool, types } = pg;

// Prevent pg from auto-parsing JSON/JSONB
types.setTypeParser(114, (val) => val);
types.setTypeParser(3802, (val) => val);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const db = {
  query: async (text, params = []) => {
    let index = 1;
    const pgText = text.replace(/\?/g, () => `$${index++}`);
    try {
      const result = await pool.query(pgText, params);
      return [result.rows, result.fields];
    } catch (err) {
      if (err.code === '23505') err.code = 'ER_DUP_ENTRY';
      throw err;
    }
  }
};

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ===== TEST =====
app.get('/api/test-db', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT 1 + 1 AS result');
    res.json({ status: 'OK', message: 'Database connected!', result: rows[0].result });
  } catch (error) {
    res.status(500).json({ error: 'Database connection failed', details: error.message });
  }
});

// ===== USERS =====
app.get('/api/users', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, phone, address, birth_date, bio, avatar, created_at FROM users');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT id, name, email, role, phone, address, birth_date, bio, avatar, created_at FROM users WHERE id = ?', [req.params.id]);
    if (rows.length > 0) res.json(rows[0]);
    else res.status(404).json({ error: 'User not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/register', async (req, res) => {
  const { id, name, email, password, role } = req.body;
  try {
    await db.query('INSERT INTO users (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)', [id, name, email, password, role || 'user']);
    res.json({ success: true, message: 'User registered successfully' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'Email sudah terdaftar!' });
    else res.status(500).json({ error: error.message });
  }
});

app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const [rows] = await db.query('SELECT id, name, email, role FROM users WHERE email = ? AND password = ?', [email, password]);
    if (rows.length > 0) res.json({ success: true, user: rows[0] });
    else res.status(401).json({ error: 'Email atau password salah!' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone, address, birth_date, bio, avatar } = req.body;
  try {
    await db.query('UPDATE users SET name = ?, email = ?, phone = ?, address = ?, birth_date = ?, bio = ?, avatar = ? WHERE id = ?', [name, email, phone, address, birth_date, bio, avatar, id]);
    res.json({ success: true, message: 'Profile updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/users/:id/password', async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;
  try {
    const [rows] = await db.query('SELECT password FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User not found' });
    if (rows[0].password !== oldPassword) return res.status(400).json({ error: 'Password lama salah!' });
    await db.query('UPDATE users SET password = ? WHERE id = ?', [newPassword, id]);
    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await db.query('DELETE FROM orders WHERE user_id = ?', [id]);
    await db.query('DELETE FROM wishlist WHERE user_id = ?', [id]);
    await db.query('DELETE FROM ratings WHERE user_id = ?', [id]);
    await db.query('DELETE FROM users WHERE id = ?', [id]);
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== ORDERS =====
app.get('/api/orders', async (req, res) => {
  const { userId, role } = req.query;
  try {
    let query = 'SELECT * FROM orders';
    let params = [];
    if (role !== 'admin' && userId) { query += ' WHERE user_id = ?'; params.push(userId); }
    query += ' ORDER BY created_at DESC';
    const [rows] = await db.query(query, params);
    const orders = rows.map(o => ({ ...o, items: JSON.parse(o.items || '[]') }));
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [req.params.id]);
    if (rows.length > 0) res.json({ ...rows[0], items: JSON.parse(rows[0].items || '[]') });
    else res.status(404).json({ error: 'Order not found' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { id, user_id, order_number, items, total_price, delivery_address, status, estimated_time, voucher_code, voucher_discount } = req.body;
  try {
    await db.query(
      'INSERT INTO orders (id, user_id, order_number, items, total_price, delivery_address, status, estimated_time, voucher_code, voucher_discount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [id, user_id, order_number, JSON.stringify(items), total_price, delivery_address, status || 'pending', estimated_time || 30, voucher_code || null, voucher_discount || 0]
    );
    res.json({ success: true, message: 'Order created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/status', async (req, res) => {
  try {
    await db.query('UPDATE orders SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ success: true, message: 'Order status updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id/payment', async (req, res) => {
  try {
    await db.query('UPDATE orders SET payment_method = ?, payment_status = \'paid\', status = \'cooking\' WHERE id = ?', [req.body.payment_method, req.params.id]);
    res.json({ success: true, message: 'Payment processed successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/orders/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM orders WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Order deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== WISHLIST =====
app.get('/api/wishlist/:userId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM wishlist WHERE user_id = ?', [req.params.userId]);
    res.json(rows.map(i => ({ ...i, meal_data: JSON.parse(i.meal_data || '{}') })));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/wishlist', async (req, res) => {
  const { id, user_id, meal_id, meal_data } = req.body;
  try {
    await db.query('INSERT INTO wishlist (id, user_id, meal_id, meal_data) VALUES (?, ?, ?, ?)', [id, user_id, meal_id, JSON.stringify(meal_data)]);
    res.json({ success: true, message: 'Added to wishlist' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'Already in wishlist' });
    else res.status(500).json({ error: error.message });
  }
});

app.delete('/api/wishlist', async (req, res) => {
  const { user_id, meal_id } = req.query;
  try {
    await db.query('DELETE FROM wishlist WHERE user_id = ? AND meal_id = ?', [user_id, meal_id]);
    res.json({ success: true, message: 'Removed from wishlist' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== RATINGS =====
app.get('/api/ratings/:mealId', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM ratings WHERE meal_id = ? ORDER BY created_at DESC', [req.params.mealId]);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/ratings', async (req, res) => {
  const { id, meal_id, user_id, user_name, rating, comment } = req.body;
  try {
    await db.query('INSERT INTO ratings (id, meal_id, user_id, user_name, rating, comment) VALUES (?, ?, ?, ?, ?, ?)', [id, meal_id, user_id, user_name, rating, comment]);
    res.json({ success: true, message: 'Rating added' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/ratings/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM ratings WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Rating deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== VOUCHERS =====
app.get('/api/vouchers', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM vouchers ORDER BY created_at DESC');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/vouchers', async (req, res) => {
  const { id, code, discount, type, expires_at, max_uses } = req.body;
  try {
    await db.query('INSERT INTO vouchers (id, code, discount, type, expires_at, max_uses) VALUES (?, ?, ?, ?, ?, ?)', [id, code, discount, type, expires_at, max_uses || 100]);
    res.json({ success: true, message: 'Voucher created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') res.status(400).json({ error: 'Kode voucher sudah ada!' });
    else res.status(500).json({ error: error.message });
  }
});

app.delete('/api/vouchers/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM vouchers WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Voucher deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== CHATS =====
app.get('/api/chats', async (req, res) => {
  const { userId, receiverId } = req.query;
  try {
    let query, params = [];
    if (userId && receiverId) {
      query = 'SELECT * FROM chats WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?) ORDER BY created_at ASC';
      params = [userId, receiverId, receiverId, userId];
    } else if (userId) {
      query = 'SELECT * FROM chats WHERE sender_id = ? OR receiver_id = ? ORDER BY created_at ASC';
      params = [userId, userId];
    } else {
      query = 'SELECT * FROM chats ORDER BY created_at ASC';
    }
    const [rows] = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chats', async (req, res) => {
  const { id, sender_id, receiver_id, message } = req.body;
  try {
    await db.query('INSERT INTO chats (id, sender_id, receiver_id, message, is_read) VALUES (?, ?, ?, ?, ?)', [id, sender_id, receiver_id, message, false]);
    res.json({ success: true, message: 'Chat sent' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/chats/read', async (req, res) => {
  const { userId, senderId } = req.query;
  try {
    await db.query('UPDATE chats SET is_read = true WHERE receiver_id = ? AND sender_id = ?', [userId, senderId]);
    res.json({ success: true, message: 'Chats marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/chats/:id', async (req, res) => {
  try {
    await db.query('DELETE FROM chats WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Chat deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/chats', async (req, res) => {
  try {
    await db.query('DELETE FROM chats');
    res.json({ success: true, message: 'All chats deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===== MEALS (TheMealDB) =====
app.get('/api/meals', async (req, res) => {
  try {
    const { search } = req.query;
    const url = `https://www.themealdb.com/api/json/v1/1/search.php?s=${search ? encodeURIComponent(search) : ''}`;
    const response = await axios.get(url);
    if (response.data.meals) {
      res.json(response.data.meals.map(meal => ({
        id: meal.idMeal, name: meal.strMeal, category: meal.strCategory || 'Unknown',
        area: meal.strArea || 'Unknown', image: meal.strMealThumb,
        instructions: meal.strInstructions || 'No instructions available',
        youtube: meal.strYoutube, source: meal.strSource,
        ingredients: Array.from({ length: 20 }, (_, i) => ({
          ingredient: meal[`strIngredient${i + 1}`], measure: meal[`strMeasure${i + 1}`]
        })).filter(item => item.ingredient && item.ingredient.trim() !== '')
      })));
    } else {
      res.json([]);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/meals/:id', async (req, res) => {
  try {
    const response = await axios.get(`https://www.themealdb.com/api/json/v1/1/lookup.php?i=${req.params.id}`);
    if (response.data.meals) {
      const meal = response.data.meals[0];
      res.json({
        id: meal.idMeal, name: meal.strMeal, category: meal.strCategory || 'Unknown',
        area: meal.strArea || 'Unknown', image: meal.strMealThumb,
        instructions: meal.strInstructions || 'No instructions available',
        youtube: meal.strYoutube, source: meal.strSource,
        ingredients: Array.from({ length: 20 }, (_, i) => ({
          ingredient: meal[`strIngredient${i + 1}`], measure: meal[`strMeasure${i + 1}`]
        })).filter(item => item.ingredient && item.ingredient.trim() !== '')
      });
    } else {
      res.status(404).json({ error: 'Meal not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const serverlessHandler = serverless(app);

export const handler = async (event, context) => {
  // When Netlify redirects /api/* → /.netlify/functions/server,
  // event.path is reset to '/'. The original path is stored in
  // the x-netlify-original-pathname header by Netlify.
  const originalPath = 
    event.headers?.['x-netlify-original-pathname'] ||
    event.headers?.['x-original-pathname'];
  
  if (originalPath) {
    event.path = originalPath;
  }

  // Also restore query string if present
  const originalSearch = event.headers?.['x-netlify-original-search'];
  if (originalSearch) {
    event.queryStringParameters = Object.fromEntries(new URLSearchParams(originalSearch));
  }

  return serverlessHandler(event, context);
};
