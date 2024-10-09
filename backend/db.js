const { Pool } = require('pg');

const pool = new Pool({
  user: 'administrator',
  host: 'localhost',
  database: 'stocks',
  password: 'dan',
  port: 5432, // Default port for PostgreSQL
});

pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to the database', err);
  } else {
    console.log('Connected to database:', res.rows);
  }
});

module.exports = pool;
