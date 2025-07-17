using Npgsql;
using Dapper;
using System.Text.Json;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
string connStr = builder.Configuration.GetConnectionString("Postgres") ?? throw new InvalidOperationException("Postgres connection string not found in configuration");

builder.Services.AddSingleton(sp =>
    new NpgsqlDataSourceBuilder(connStr).Build());

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<NpgsqlConnection>(provider => new NpgsqlConnection(connStr));
builder.WebHost.UseUrls("http://0.0.0.0:5050");

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

// GET /api/data
//
// Purpose: Control endpoint to test minimal response overhead.
// Measures:
// - Minimal processing latency
// - HTTP response speed without DB or CPU cost
app.MapGet("/api/data", () =>
{
    return Results.Json(new { message = "ASP.NET Core response", timestamp = DateTime.UtcNow });
});

// GET /api/cpu
//
// Purpose: Simulate a CPU-bound operation (e.g. recursive Fibonacci).
// Measures:
// - Pure CPU load on the API server
// - Thread/event loop blocking behavior under stress
app.MapGet("/api/cpu", () =>
{
    int Fib(int n) => n <= 1 ? n : Fib(n - 1) + Fib(n - 2);
    var result = Fib(35); // Recursive, slow on purpose

    return Results.Json(new { fib = result, timestamp = DateTime.UtcNow });
});

// GET /api/customers
//
// Purpose: Lightweight read query from the database.
// Measures:
// - Simple SELECT latency
// - DB driver performance
// - JSON serialization for small result sets
app.MapGet("/api/customers", async (NpgsqlDataSource dataSource) =>
{
    await using var conn = await dataSource.OpenConnectionAsync();
    var customers = await conn.QueryAsync("SELECT customer_id, company_name FROM customers LIMIT 10");
    return Results.Json(customers);
});

// POST /api/orders
//
// Purpose: Write-intensive endpoint to insert order records.
// Measures:
// - Database write performance
// - Driver-level efficiency (Dapper vs pg)
// - API responsiveness under frequent inserts
app.MapPost("/api/orders", async (OrderInput input, NpgsqlDataSource dataSource) =>
{
    await using var conn = await dataSource.OpenConnectionAsync();
    var sql = @"INSERT INTO test_orders (customer_id, total)
            VALUES (@CustomerId, @Total)";

    var result = await conn.ExecuteAsync(sql, new
    {
        CustomerId = input.customer_id,
        Total = input.total
    });

    return Results.Ok(new { inserted = result });
});

// GET /api/orders/with-customer
//
// Purpose: Multi-table join and JSON shaping.
// Measures:
// - SQL JOIN performance
// - Data mapping from flat DB result to structured JSON
// - API server’s ability to shape and serialize joined data
app.MapGet("/api/orders/with-customer", async (NpgsqlDataSource dataSource) =>
{
    await using var conn = await dataSource.OpenConnectionAsync();
    var sql = @"
        SELECT o.id AS order_id, o.customer_id AS customer_id, c.company_name AS company_name, o.total AS total
        FROM test_orders o
        JOIN customers c ON o.customer_id = c.customer_id
        LIMIT 50";

    var results = await conn.QueryAsync<OrderWithCustomer>(sql);
    return Results.Ok(results);
});

// GET /api/orders/bulk
//
// Purpose: Simulates a heavy-read scenario by returning 1000+ rows from the database.
// This endpoint is designed to benchmark:
// - Memory consumption under large payloads
// - JSON serialization performance
// - Throughput under high load
app.MapGet("/api/orders/bulk", async (NpgsqlDataSource dataSource) =>
{
    await using var conn = await dataSource.OpenConnectionAsync();
    var sql = @"
        SELECT id AS order_id, customer_id AS customer_id, order_date AS order_date, total AS total
        FROM test_orders
        ORDER BY id DESC
        LIMIT 1000";

    var results = await conn.QueryAsync<OrderRecord>(sql);
    return Results.Ok(results);
});

// GET /api/stats
//
// Purpose: Return simple aggregate stats from the database (total orders, average total).
// Measures:
// - SQL aggregate query performance
// - JSON serialization of scalar values
// - Low-memory, high-frequency endpoint efficiency
app.MapGet("/api/stats", async (NpgsqlDataSource dataSource) =>
{
    await using var conn = await dataSource.OpenConnectionAsync();
    var sql = @"
        SELECT COUNT(*) AS total_orders, 
               COALESCE(AVG(total), 0) AS avg_total
        FROM test_orders";

    var result = await conn.QueryFirstAsync<StatsResult>(sql);
    return Results.Ok(result);
});

// GET /api/simulated-delay
//
// Purpose: Simulates an artificial 200ms delay to test the API server's async concurrency handling.
// Measures:
// - Ability to scale under non-blocking workloads
// - Thread pool and request scheduling efficiency
app.MapGet("/api/simulated-delay", async () =>
{
    await Task.Delay(200);
    return Results.Json(new { message = "Delayed response", delay = "200ms" });
});

// GET /api/file-read
//
// Purpose: Reads a local file from disk and returns its contents.
// Measures:
// - File system access latency
// - API’s performance reading and serializing large files
app.MapGet("/api/file-read", () =>
{
    var filePath = "/app/sample-data/large.json";
    if (!System.IO.File.Exists(filePath))
        return Results.NotFound("File not found");

    var stream = System.IO.File.OpenRead(filePath);
    return Results.Stream(stream, "application/json");
});

app.Run();

record StatsResult(long total_orders, decimal avg_total);
record OrderRecord(int order_id, string customer_id, DateTime order_date, decimal total);
record OrderWithCustomer(int order_id, string customer_id, string company_name, decimal total);
record OrderInput(string customer_id, decimal total);
