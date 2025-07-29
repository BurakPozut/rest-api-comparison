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

// GET /api/file-read
//
// Purpose: Reads a local file from disk and returns its contents.
// Measures:
// - File system access latency
// - API’s performance reading and serializing large files
app.MapGet("/api/file-read", () =>
{
    var filePath = "/app/sample-data/large.json";
    // var filePath = "../sample-data/large.json";
    if (!System.IO.File.Exists(filePath))
        return Results.NotFound("File not found");

    var stream = System.IO.File.OpenRead(filePath);
    return Results.Stream(stream, "application/json");
});

// POST /api/login
//
// Purpose: Authenticates a user based on email and password.
// Measures:
// - I/O latency for querying user data from the database
// - CPU-bound password hash verification using bcrypt
// - Realistic simulation of login flow for benchmarking authentication endpoints
app.MapPost("/api/login", async (LoginRequest request, NpgsqlDataSource dataSource) =>
{
    await using var conn = await dataSource.OpenConnectionAsync();

    var result = await conn.QueryFirstOrDefaultAsync(
    "SELECT password_hash FROM users WHERE email = @Email",
    new { Email = request.Email });

    if (result == null || !BCrypt.Net.BCrypt.Verify(request.Password, result.password_hash))
    {
        return Results.Unauthorized();
    }

    return Results.Ok(new { message = "Login successful", token = "dummy.jwt.token" });
});

// POST /api/upload
//
// Purpose: Simulates file upload by accepting a multipart/form-data file.
// Measures:
// - Multipart parsing performance
// - I/O performance for buffering/parsing file uploads
// - End-to-end latency for typical file transfer payloads (e.g., 250KB)
app.MapPost("/api/upload", async (HttpRequest request) =>
{
    if (!request.HasFormContentType)
        return Results.BadRequest("Expected multipart/form-data");

    var form = await request.ReadFormAsync();
    var file = form.Files.GetFile("file");

    if (file == null)
        return Results.BadRequest("No file uploaded");

    // Generate a unique filename
    var uniqueSuffix = $"{DateTimeOffset.UtcNow.ToUnixTimeMilliseconds()}-{Guid.NewGuid().ToString()[..6]}";
    var safeFileName = $"{uniqueSuffix}-{file.FileName}";

    var currentDir = Directory.GetCurrentDirectory(); // asp-api/
    // var tempPath = Path.Combine(currentDir, "../node-asp-tmp", safeFileName);
    var tempPath = Path.Combine("/app/node-asp-tmp", safeFileName);
    var fullPath = Path.GetFullPath(tempPath); // normalize path

    using (var stream = new FileStream(fullPath, FileMode.Create))
    {
        await file.CopyToAsync(stream);
    }

    return Results.Ok(new { file.FileName, file.Length, savedTo = safeFileName });
});

app.Run();

record StatsResult(long total_orders, decimal avg_total);
record OrderRecord(int order_id, string customer_id, DateTime order_date, decimal total);
record OrderWithCustomer(int order_id, string customer_id, string company_name, decimal total);
record OrderInput(string customer_id, decimal total);
record LoginRequest(string Email, string Password);
record User(int Id, string Email, string PasswordHash);