const fastify = require('fastify')({ logger: false });
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'northwind',
  password: '989258456',
  port: 5432,
});

// GET /api/data
//
// Purpose: Control endpoint to test minimal response overhead.
// Measures:
// - Minimal processing latency
// - HTTP response speed without DB or CPU cost
fastify.get('/api/data', async (request, reply) => {
  return {
    message: 'Node.js + Fastify response',
    timestamp: new Date().toISOString()
  };
});

// GET /api/cpu
//
// Purpose: Simulate a CPU-bound operation (e.g. recursive Fibonacci).
// Measures:
// - Pure CPU load on the API server
// - Thread/event loop blocking behavior under stress
fastify.get('/api/cpu', async (request, reply) => {
  function fib(n) {
    return n <= 1 ? n : fib(n - 1) + fib(n - 2);
  }
  const result = fib(35); // Match .NET work

  return {
    fib: result,
    timestamp: new Date().toISOString()
  };
});

// GET /api/customers
//
// Purpose: Lightweight read query from the database.
// Measures:
// - Simple SELECT latency
// - DB driver performance
// - JSON serialization for small result sets
fastify.get('/api/customers', async (req, reply) => {
  const { rows } = await pool.query('SELECT customer_id, company_name FROM customers LIMIT 10');
  return rows;
});

// POST /api/orders
//
// Purpose: Write-intensive endpoint to insert order records.
// Measures:
// - Database write performance
// - Driver-level efficiency (Dapper vs pg)
// - API responsiveness under frequent inserts
fastify.post('/api/orders', async (request, reply) => {
  const { customer_id, total } = request.body;

  console.log('Received order');
  console.log(`Received order: ${customer_id} ${total}`);

  const sql = 'INSERT INTO test_orders (customer_id, total) VALUES ($1, $2)';
  const result = await pool.query(sql, [customer_id, total]);

  return { inserted: result.rowCount };
});


// GET /api/orders/with-customer
//
// Purpose: Multi-table join and JSON shaping.
// Measures:
// - SQL JOIN performance
// - Data mapping from flat DB result to structured JSON
// - API server’s ability to shape and serialize joined data
fastify.get('/api/orders/with-customer', async (request, reply) => {
  const sql = `
    SELECT o.id AS order_id, o.customer_id, c.company_name, o.total
    FROM test_orders o
    JOIN customers c ON o.customer_id = c.customer_id
    LIMIT 50
  `;

  const { rows } = await pool.query(sql);
  return rows;
});

// GET /api/orders/bulk
//
// Purpose: Simulates a heavy-read scenario by returning 1000+ rows from the database.
// This endpoint is designed to benchmark:
// - Memory consumption under large payloads
// - JSON serialization performance
// - Throughput under high load
fastify.get('/api/orders/bulk', async (request, reply) => {
  const sql = `
    SELECT id AS order_id, customer_id, order_date, total
    FROM test_orders
    ORDER BY id DESC
    LIMIT 1000
  `;

  const { rows } = await pool.query(sql);
  return rows;
});

// GET /api/stats
//
// Purpose: Return simple aggregate stats from the database (total orders, average total).
// Measures:
// - SQL aggregate query performance
// - JSON serialization of scalar values
// - Low-memory, high-frequency endpoint efficiency
fastify.get('/api/stats', async (request, reply) => {
  const sql = `
    SELECT COUNT(*) AS total_orders,
           COALESCE(AVG(total), 0) AS avg_total
    FROM test_orders
  `;

  const { rows } = await pool.query(sql);
  return rows[0]; // return scalar values as JSON
});

// GET /api/simulated-delay
//
// Purpose: Simulates an artificial 200ms delay to test the API server's async concurrency handling.
// Measures:
// - Ability to scale under non-blocking workloads
// - Event loop and timer queue performance under high load
fastify.get('/api/simulated-delay', async (request, reply) => {
  await new Promise(resolve => setTimeout(resolve, 200));
  return { message: 'Delayed response', delay: '200ms' };
});

// GET /api/file-read
//
// Purpose: Reads a local file from disk and returns its contents.
// Measures:
// - File system access latency
// - API’s performance reading and serializing large files
fastify.get('/api/file-read', async (request, reply) => {
  const fs = require('fs/promises');
  const path = require('path');
  const filePath = path.join(__dirname, '..', 'sample-data', 'large.json');

  try {
    const content = await fs.readFile(filePath, 'utf-8');
    reply.header('Content-Type', 'application/json').send(content);
  } catch (err) {
    reply.code(404).send({ error: 'File not found' });
  }
});

const start = async () => {
  try {
    await fastify.listen({ port: 3000, host: '0.0.0.0' });
    console.log('🚀 Fastify listening on port 3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
