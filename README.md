# REST API Performance Comparison: ASP.NET Core vs Node.js

This project compares the performance of two REST API implementations — one built with **ASP.NET Core 8 (C#)** and the other with **Node.js 20 + Fastify** — under identical conditions.

The goal is to evaluate the **raw performance**, **resource usage**, and **response characteristics** of each framework when serving the same endpoints using the same database.

---

## 🧪 What’s Being Compared

- **ASP.NET Core 8** (Minimal APIs or MVC, Kestrel web server)
- **Node.js 20** with **Fastify** (a high-performance HTTP framework)
- **Database**: Same schema and dataset on a local SQL Server or PostgreSQL instance
- **Workload**: Repeated concurrent HTTP GET requests to a simple data endpoint

---

## 📁 Project Structure

```
rest-api-comparison/
├── aspnet-api/       # ASP.NET Core 8 REST API
├── node-api/         # Node.js + Fastify REST API
├── db/               # Shared SQL schema and seed data
├── scripts/          # Benchmarking scripts (wrk, k6)
├── results/          # Logs and output from benchmarking tools
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

- [Node.js 20+](https://nodejs.org/en/)
- [.NET SDK 8.0+](https://dotnet.microsoft.com/)
- [SQL Server](https://www.microsoft.com/en-us/sql-server/) or [PostgreSQL](https://www.postgresql.org/)
- `wrk` or `k6` for benchmarking
- A Linux or Windows server (recommended for accurate results)

### Clone the repo

```bash
git clone https://github.com/yourusername/rest-api-comparison.git
cd rest-api-comparison
```

### Run both APIs

```bash
# Terminal 1: run ASP.NET Core API
cd aspnet-api
dotnet run

# Terminal 2: run Node.js API
cd node-api
npm install
npm start
```

---

## 🧪 Benchmarking Instructions

Use a separate machine (or your dev machine) to simulate client load:

```bash
wrk -t4 -c50 -d20s http://your-server-ip:5000/api/data   # ASP.NET Core
wrk -t4 -c50 -d20s http://your-server-ip:3000/api/data   # Node.js
```

Monitor system resources with:

```bash
# For Node.js
pidstat -p $(pidof node)

# For .NET
dotnet-counters monitor --process-id <pid>
```

---

## 📊 Metrics Collected

- Requests per second (RPS)
- Latency percentiles (p50, p90, p99)
- CPU and memory usage
- Error rate (5xx, timeouts)

---

## 📌 Goals

- Understand performance differences in real-world setups
- Compare resource efficiency under load
- Share reproducible benchmarks in a public and open-source format

---

## 📄 License

MIT License — free to use and modify with attribution.
