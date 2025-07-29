const fastify = require("fastify")({ logger: false });

const pool = require("./db"); // path to db.js
fastify.register(require("@fastify/multipart"));

// GET /api/cpu
//
// Purpose: Simulate a CPU-bound operation (e.g. recursive Fibonacci).
// Measures:
// - Pure CPU load on the API server
// - Thread/event loop blocking behavior under stress
fastify.get("/api/cpu", async (request, reply) => {
  function fib(n) {
    return n <= 1 ? n : fib(n - 1) + fib(n - 2);
  }
  const result = fib(35); // Match .NET work

  return {
    fib: result,
    timestamp: new Date().toISOString(),
  };
});

// GET /api/customers
//
// Purpose: Lightweight read query from the database.
// Measures:
// - Simple SELECT latency
// - DB driver performance
// - JSON serialization for small result sets
fastify.get("/api/customers", async (req, reply) => {
  const { rows } = await pool.query(
    "SELECT customer_id, company_name FROM customers LIMIT 10"
  );
  return rows;
});

// POST /api/orders
//
// Purpose: Write-intensive endpoint to insert order records.
// Measures:
// - Database write performance
// - Driver-level efficiency (Dapper vs pg)
// - API responsiveness under frequent inserts
fastify.post("/api/orders", async (request, reply) => {
  const { customer_id, total } = request.body;

  const sql = "INSERT INTO test_orders (customer_id, total) VALUES ($1, $2)";
  const result = await pool.query(sql, [customer_id, total]);

  return { inserted: result.rowCount };
});

// GET /api/orders/bulk
//
// Purpose: Simulates a heavy-read scenario by returning 1000+ rows from the database.
// This endpoint is designed to benchmark:
// - Memory consumption under large payloads
// - JSON serialization performance
// - Throughput under high load
fastify.get("/api/orders/bulk", async (request, reply) => {
  const sql = `
    SELECT id AS order_id, customer_id, order_date, total
    FROM test_orders
    ORDER BY id DESC
    LIMIT 1000
  `;

  const { rows } = await pool.query(sql);
  return rows;
});

// GET /api/file-read
//
// Purpose: Streams a local file from disk and returns its contents.
// Measures:
// - File system access latency
// - API's performance streaming large files
// - Memory efficiency for large files
fastify.get("/api/file-read", async (request, reply) => {
  const fs = require("fs");
  const path = require("path");
  const filePath = "/app/sample-data/large.json"; // ✅ ABSOLUTE path inside container

  // Use absolute path from the project root
  // const filePath = path.join(__dirname, '..', 'sample-data', 'large.json');

  try {
    // Check if file exists first
    if (!fs.existsSync(filePath)) {
      return reply.code(404).send({ error: "File not found", path: filePath });
    }

    // Read file content and send as JSON
    const fileContent = fs.readFileSync(filePath, "utf-8");
    reply.header("Content-Type", "application/json");
    return reply.send({
      message: "File read successfully",
      content: JSON.parse(fileContent),
      size: fileContent.length,
    });
  } catch (err) {
    console.error("File read error:", err);
    return reply.code(500).send({ error: err.message, path: filePath });
  }
});

// POST /api/login
//
// Purpose: Authenticates a user based on email and password.
// Measures:
// - I/O latency for querying user data from the database
// - CPU-bound password hash verification using bcrypt
// - Realistic simulation of login flow for benchmarking authentication endpoints
fastify.post("/api/login", async (request, reply) => {
  const { email, password } = request.body;

  const bcrypt = require("bcrypt");
  try {
    const { rows } = await pool.query("SELECT * FROM users WHERE email = $1", [
      email,
    ]);
    const user = rows[0];

    if (!user || !(await bcrypt.compare(password, user.password_hash))) {
      return reply.code(401).send({ error: "Invalid credentials" });
    }

    // Simulate JWT/token creation
    return reply.send({
      message: "Login successful",
      token: "dummy.jwt.token",
    });
  } catch (err) {
    return reply.code(500).send({ error: err.message });
  }
});

// POST /api/upload
//
// Purpose: Simulates a typical file upload with 250KB input
// Measures:
// - Parsing performance of multipart/form-data
// - Memory throughput for uploaded files
fastify.post("/api/upload", async function (request, reply) {
  const path = require("path");
  const fs = require("fs");
  const { pipeline } = require("stream/promises");

  const parts = request.parts();

  for await (const part of parts) {
    if (part.file) {
      // Resolve path relative to node-api folder
      const uniqueSuffix = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 8)}`;
      const safeName = `${uniqueSuffix}-${part.filename}`;
      // const tempPath = path.resolve(__dirname, '../node-asp-tmp', safeName);
      const tempPath = path.resolve("/app/node-asp-tmp", safeName);
      const writeStream = fs.createWriteStream(tempPath);

      await pipeline(part.file, writeStream);

      const stats = fs.statSync(tempPath);
      return reply.send({
        message: "File uploaded and saved",
        size: stats.size,
        path: safeName,
      });
    }
  }

  reply.code(400).send({ error: "No file uploaded" });
});

const start = async () => {
  try {
    await fastify.listen({ port: 3002, host: "0.0.0.0" });
    console.log("🚀 Fastify listening on port 3002");
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();
