# @sfc-gh-testorg/cfaulkner-test-service-b

API Gateway Service for SFC-GH-TestOrg platform.

## Dependencies

This service depends on:
- **[@sfc-gh-testorg/cfaulkner-test-shared-lib](https://github.com/SFC-GH-TestOrg/cfaulkner-test-shared-lib)** - Shared utilities for formatting, parsing, validation, and logging

## Features

- Request routing and load balancing
- Rate limiting
- Request/response transformation
- API versioning
- Health checks
- Metrics collection

## Architecture

```
┌─────────────┐     ┌─────────────────────┐     ┌─────────────────────┐
│   Client    │────▶│   service-b         │────▶│   service-a         │
│             │     │   (API Gateway)     │     │   (User Service)    │
└─────────────┘     └─────────────────────┘     └─────────────────────┘
                              │
                              ▼
                    ┌─────────────────────┐
                    │   shared-lib        │
                    │   (Utilities)       │
                    └─────────────────────┘
```

## Usage

```javascript
import { ApiGateway } from '@sfc-gh-testorg/cfaulkner-test-service-b';

const gateway = new ApiGateway(configJson);

// Register routes
gateway.route('/api/v1/users', 'service-a');
gateway.route('/api/v1/products', 'service-c');

// Start gateway
gateway.listen(8080);
```

## Configuration

```json
{
  "port": 8080,
  "rateLimit": {
    "windowMs": 60000,
    "max": 100
  },
  "upstreams": {
    "service-a": "http://localhost:3001",
    "service-c": "http://localhost:3002"
  }
}
```

Configuration is parsed using `parseConfig()` from `@sfc-gh-testorg/cfaulkner-test-shared-lib`.

## Shared Library Usage

This service uses the following from `@sfc-gh-testorg/cfaulkner-test-shared-lib`:

| Function | Usage |
|----------|-------|
| `formatDate()` | Request timestamps, response headers, metrics |
| `parseConfig()` | Loading gateway configuration |
| `validateInput()` | Request validation, header checks |
| `Logger` | Access logs, error logs, metrics logs |

## Related Services

- [cfaulkner-test-service-a](https://github.com/SFC-GH-TestOrg/cfaulkner-test-service-a) - User Management Service (upstream)
- [cfaulkner-test-shared-lib](https://github.com/SFC-GH-TestOrg/cfaulkner-test-shared-lib) - Shared utilities

## API Endpoints

| Method | Endpoint | Upstream | Description |
|--------|----------|----------|-------------|
| * | /api/v1/users/* | service-a | User management |
| GET | /health | - | Health check |
| GET | /metrics | - | Prometheus metrics |

## Metrics

The gateway exposes the following metrics:
- `gateway_requests_total` - Total requests
- `gateway_request_duration_seconds` - Request latency
- `gateway_upstream_errors_total` - Upstream errors
