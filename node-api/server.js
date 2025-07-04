const fastify = require('fastify')({ logger: false });
const { Pool } = require('pg');

const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'northwind',
  password: '989258456',
  port: 5432,
});

fastify.get('/api/data', async (request, reply) => {
  return {
    message: 'Node.js + Fastify response',
    timestamp: new Date().toISOString()
  };
});

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

fastify.get('/api/customers', async (req, reply) => {
  const { rows } = await pool.query('SELECT customer_id, company_name FROM customers LIMIT 10');
  return rows;
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
