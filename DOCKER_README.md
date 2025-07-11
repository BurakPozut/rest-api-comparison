# Docker Setup for REST API Comparison

This repository contains Docker configurations for running both the ASP.NET Core API and Node.js API with PostgreSQL database.

## Prerequisites

- Docker
- Docker Compose

## Quick Start

### Option 1: Using Docker Compose (Recommended)

1. **Start all services:**
   ```bash
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   # All services
   docker-compose logs -f
   
   # Specific service
   docker-compose logs -f aspnet-api
   docker-compose logs -f node-api
   ```

4. **Stop all services:**
   ```bash
   docker-compose down
   ```

### Option 2: Individual Docker Commands

#### ASP.NET Core API

1. **Build the image:**
   ```bash
   cd aspnet-api
   docker build -t aspnet-api .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name aspnet-api \
     -p 5000:5000 \
     -e ConnectionStrings__Postgres="Host=your-postgres-host;Database=northwind;Username=postgres;Password=989258456" \
     -v $(pwd)/../sample-data:/app/sample-data:ro \
     aspnet-api
   ```

#### Node.js API

1. **Build the image:**
   ```bash
   cd node-api
   docker build -t node-api .
   ```

2. **Run the container:**
   ```bash
   docker run -d \
     --name node-api \
     -p 3000:3000 \
     -e NODE_ENV=production \
     -v $(pwd)/../sample-data:/app/sample-data:ro \
     node-api
   ```

## Service Endpoints

### ASP.NET Core API (Port 5000)
- **Base URL:** `http://localhost:5000`
- **Swagger UI:** `http://localhost:5000/swagger`
- **Endpoints:**
  - `GET /api/data` - Minimal response test
  - `GET /api/cpu` - CPU-bound operation test
  - `GET /api/customers` - Database read test
  - `POST /api/orders` - Database write test
  - `GET /api/orders/with-customer` - Join query test
  - `GET /api/orders/bulk` - Large dataset test
  - `GET /api/stats` - Aggregate query test
  - `GET /api/simulated-delay` - Async delay test
  - `GET /api/file-read` - File system test

### Node.js API (Port 3000)
- **Base URL:** `http://localhost:3000`
- **Endpoints:**
  - `GET /api/data` - Minimal response test
  - `GET /api/cpu` - CPU-bound operation test
  - `GET /api/customers` - Database read test
  - `POST /api/orders` - Database write test
  - `GET /api/orders/with-customer` - Join query test
  - `GET /api/orders/bulk` - Large dataset test
  - `GET /api/stats` - Aggregate query test
  - `GET /api/simulated-delay` - Async delay test
  - `GET /api/file-read` - File system test

### PostgreSQL Database (Port 5432)
- **Host:** `localhost`
- **Port:** `5432`
- **Database:** `northwind`
- **Username:** `postgres`
- **Password:** `989258456`

## Environment Variables

### ASP.NET Core API
- `ASPNETCORE_ENVIRONMENT`: Set to `Development` or `Production`
- `ASPNETCORE_URLS`: Set to `http://+:5000` for HTTP
- `ConnectionStrings__Postgres`: PostgreSQL connection string

### Node.js API
- `NODE_ENV`: Set to `production` for optimized builds
- Database connection is configured in `server.js`

## Volume Mounts

Both APIs mount the `sample-data` directory as a read-only volume to access the `large.json` file for the file-read endpoint.

## Troubleshooting

### Common Issues

1. **Port conflicts:**
   - Change the port mappings in `docker-compose.yml` if ports 3000, 5000, or 5432 are already in use

2. **Database connection issues:**
   - Ensure PostgreSQL container is healthy before starting API containers
   - Check connection strings in environment variables

3. **File access issues:**
   - Ensure the `sample-data` directory exists and contains `large.json`
   - Check volume mount permissions

### Useful Commands

```bash
# Rebuild images
docker-compose build --no-cache

# Restart specific service
docker-compose restart aspnet-api

# Execute commands in running containers
docker-compose exec aspnet-api dotnet --version
docker-compose exec node-api node --version

# View container resource usage
docker stats

# Clean up unused resources
docker system prune -f
```

## Production Considerations

1. **Security:**
   - Change default database passwords
   - Use environment variables for sensitive data
   - Consider using Docker secrets for production

2. **Performance:**
   - Use production-optimized base images
   - Configure proper resource limits
   - Enable health checks

3. **Monitoring:**
   - Add logging configurations
   - Set up monitoring and alerting
   - Configure proper log rotation

## Development

For development, you can override the Docker Compose configuration:

```bash
# Use development overrides
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d
```

This setup provides a complete containerized environment for running both APIs with a shared PostgreSQL database, making it easy to deploy and test the performance comparison between ASP.NET Core and Node.js. 