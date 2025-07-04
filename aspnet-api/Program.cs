using Npgsql;
using Dapper;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

string connStr = builder.Configuration.GetConnectionString("Postgres");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapGet("/api/data", () =>
{
    return Results.Json(new { message = "ASP.NET Core response", timestamp = DateTime.UtcNow });
});

app.MapGet("/api/cpu", () =>
{
    int Fib(int n) => n <= 1 ? n : Fib(n - 1) + Fib(n - 2);
    var result = Fib(35); // Recursive, slow on purpose

    return Results.Json(new { fib = result, timestamp = DateTime.UtcNow });
});

app.MapGet("/api/customers", async () =>
{
    using var conn = new NpgsqlConnection(connStr);
    var customers = await conn.QueryAsync("SELECT customer_id, company_name FROM customers LIMIT 10");
    return Results.Json(customers);
});

app.Run();


