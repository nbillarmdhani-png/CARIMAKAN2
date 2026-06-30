import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool, types } = pg;

// Prevent pg from automatically parsing JSON/JSONB so it acts like MySQL's longtext
// PostgreSQL type IDs: 114 (JSON), 3802 (JSONB)
types.setTypeParser(114, (val) => val);
types.setTypeParser(3802, (val) => val);

// Use DATABASE_URL for Supabase connection string
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false // Supabase requires SSL
  }
});

// Wrapper to make 'pg' compatible with existing 'mysql2' queries
const db = {
  query: async (text, params = []) => {
    // Convert MySQL '?' placeholders to PostgreSQL '$1', '$2' placeholders
    let index = 1;
    const pgText = text.replace(/\?/g, () => `$${index++}`);
    
    try {
      const result = await pool.query(pgText, params);
      // mysql2 returns [rows, fields]
      return [result.rows, result.fields];
    } catch (err) {
      // Map PostgreSQL unique violation (23505) to MySQL's ER_DUP_ENTRY
      if (err.code === '23505') {
        err.code = 'ER_DUP_ENTRY';
      }
      console.error('Database query error:', err);
      throw err;
    }
  }
};

export default db;