const { Pool } = require('pg');

// Set up PostgreSQL connection
const pool = new Pool({
  user: 'your-db-user',
  host: 'localhost',
  database: 'stocks',
  password: 'your-db-password',
  port: 5432,
});

module.exports = pool;
