# GitHub Analytics API

A NestJS-based API for interacting with GitHub, providing user and repository insights, caching, validation, and standardized error handling. Designed for robust integrations with clean, type-safe DTOs, caching strategies, and observability.

---

## Table of Contents

- [GitHub Analytics API](#github-analytics-api)
  - [Table of Contents](#table-of-contents)
  - [Features](#features)
  - [Architecture](#architecture)
  - [Getting Started](#getting-started)
  - [Environment Variables](#environment-variables)
  - [Docker \& Monitoring](#docker--monitoring)
  - [API Endpoints](#api-endpoints)
  - [Testing](#testing)

---

## Features

* **Centralized Configuration**
  `GitHubConfigService` manages all GitHub-related settings, validating inputs and providing defaults.

* **DTOs for Type Safety**

  * `UserSummaryDto`, `RepositoryDto`, `ReadmeDto`, `RandomRepositoryDto`
  * Ensures consistent API responses and Swagger documentation.

* **Input Validation**
  `GitHubValidators` validate usernames, repository names, and star ranges, throwing typed exceptions for invalid input.

* **Custom Errors**
  `GitHubNotFoundError`, `GitHubRateLimitError`, and other typed exceptions simplify error handling and logging.

* **Caching & Performance**

  * Cache-first strategy for GitHub API calls.
  * Configurable cache timeout via `GitHubConfigService`.

* **Main Service Layer**
  `GitHubService` orchestrates API calls, caching, validation, and transformation into clean DTOs.

* **Observability**
  Prometheus and Grafana integration for monitoring API metrics.

---

## Architecture

**Modules & Services**

| Component               | Purpose                                                                             |
| ----------------------- | ----------------------------------------------------------------------------------- |
| `GitHubConfigService`   | Centralized config provider with defaults, validation, and immutable access.        |
| `GitHubValidators`      | Input validation for usernames, repositories, and star ranges.                      |
| `GitHubService`         | Orchestrates API calls, caching, validation, and business logic.                    |
| `GitHubController`      | Exposes REST endpoints and handles HTTP concerns.                                   |
| `GitHubExceptionFilter` | Converts GitHub API errors into standardized HTTP responses.                        |
| DTOs                    | Standardized response objects for users, repositories, README content, and queries. |
| `common.module.ts`      | Shared module exposing config and validators via dependency injection.              |

**Flow Example (User Stats)**

```
HTTP Request → DTO Validation → GitHubService
→ Check Cache → GitHub API Call → Transform Data
→ Cache Result → Return DTO → HTTP Response
```

---

## Getting Started

1. **Install dependencies**

```bash
npm install
```

2. **Run the application**

```bash
npm run start:dev
```

3. **Run tests**

```bash
npm run test        # Run all tests
npm run test:watch  # Watch mode
npm run test:cov    # Coverage report
```

---

## Environment Variables

| Variable           | Description                   |
| ------------------ | ----------------------------- |
| `GITHUB_TOKEN`     | Personal GitHub API token     |
| `MAX_REPOSITORIES` | Max repositories to fetch     |
| `CACHE_TIMEOUT_MS` | Cache timeout in milliseconds |

---

## Docker & Monitoring

You can run Prometheus and Grafana using Docker Compose:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    ports:
      - '9090:9090'
    volumes:
      - ./monitoring/prometheus.yml:/etc/prometheus/prometheus.yml
    restart: unless-stopped

  grafana:
    image: grafana/grafana:latest
    ports:
      - '3001:3000'
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=admin
    restart: unless-stopped
    depends_on:
      - prometheus
```

Access Grafana at [http://localhost:3001](http://localhost:3001).

---

## API Endpoints

| Method | Endpoint                        | Description                              |
| ------ | ------------------------------- | ---------------------------------------- |
| GET    | `/v1/users/:username/summary`   | Fetch user profile with top repositories |
| GET    | `/v1/repos/:owner/:repo`        | Fetch specific repository details        |
| GET    | `/v1/repos/:owner/:repo/readme` | Fetch repository README                  |
| GET    | `/v1/repositories/random`       | Fetch a random repository                |

All endpoints include input validation and standardized error handling.

---

## API Documentation

The API is fully documented using the OpenAPI (Swagger) specification. After starting the application, you can access:

- **Swagger UI**: `http://localhost:3000/api` - Interactive API documentation
- **OpenAPI JSON**: `http://localhost:3000/api-json` - Raw OpenAPI specification

The documentation includes:
- Detailed endpoint descriptions
- Request/response schemas
- Example requests
- Authentication requirements
- Error responses

To enable/disable the documentation in different environments, set the `NODE_ENV` environment variable accordingly.

---

## Testing

* **Unit Tests**
  Test validators, services, and DTOs using Vitest.
* **Coverage**
  Check coverage with:

```bash
npm run test:cov
```

* **Test Factories**
  `test-factories.ts` provides reusable mocks for deterministic tests.

