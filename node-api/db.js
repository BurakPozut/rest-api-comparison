const { Pool } = require('pg');
// get the .env from the parent directory
const path = require('path');
const envPath = path.resolve(__dirname, '..', '.env');
// console.log(envPath);
const dotenv = require('dotenv');
dotenv.config({ path: envPath });

// console.log(process.env.POSTGRES_USER);
// console.log(process.env.POSTGRES_HOST);
// console.log(process.env.POSTGRES_DB);
// console.log(process.env.POSTGRES_PASSWORD);
// console.log(process.env.POSTGRES_PORT);
// console.log(process.env.POSTGRES_POOL_MAX);

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.POSTGRES_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: process.env.POSTGRES_PORT,
  max: parseInt(process.env.POSTGRES_POOL_MAX || '10', 10), // pool size
  idleTimeoutMillis: 30000, // 30 seconds before idle clients are closed
});

module.exports = pool;