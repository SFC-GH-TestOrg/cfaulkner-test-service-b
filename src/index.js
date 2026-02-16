/**
 * API Gateway Service
 * 
 * This service handles request routing, rate limiting, and API management.
 * 
 * @module @sfc-gh-testorg/cfaulkner-test-service-b
 * @requires @sfc-gh-testorg/cfaulkner-test-shared-lib
 */

import { 
  formatDate, 
  parseConfig, 
  validateInput, 
  Logger 
} from '@sfc-gh-testorg/cfaulkner-test-shared-lib';

const logger = new Logger('api-gateway');

const routeSchema = {
  path: { required: true, type: 'string' },
  upstream: { required: true, type: 'string' }
};

export class ApiGateway {
  constructor(configJson) {
    this.config = parseConfig(configJson);
    this.routes = new Map();
    this.rateLimitStore = new Map();
    this.metrics = {
      requestsTotal: 0,
      errorsTotal: 0,
      requestDurations: []
    };
    
    logger.info('ApiGateway initialized', { 
      port: this.config.port,
      rateLimit: this.config.rateLimit 
    });
  }

  route(path, upstream) {
    const validation = validateInput({ path, upstream }, routeSchema);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.routes.set(path, {
      upstream,
      registeredAt: formatDate(new Date())
    });
    
    logger.info('Route registered', { path, upstream });
  }

  async handleRequest(request) {
    const startTime = Date.now();
    this.metrics.requestsTotal++;

    const requestLog = {
      method: request.method,
      path: request.path,
      timestamp: formatDate(new Date()),
      requestId: crypto.randomUUID()
    };

    logger.info('Request received', requestLog);

    if (!this.checkRateLimit(request.clientIp)) {
      logger.warn('Rate limit exceeded', { clientIp: request.clientIp });
      return {
        status: 429,
        body: { error: 'Rate limit exceeded' },
        headers: {
          'X-RateLimit-Reset': formatDate(new Date(Date.now() + this.config.rateLimit?.windowMs || 60000))
        }
      };
    }

    const route = this.findRoute(request.path);
    if (!route) {
      logger.warn('Route not found', { path: request.path });
      return { status: 404, body: { error: 'Not found' } };
    }

    try {
      const response = await this.forwardRequest(route.upstream, request);
      
      const duration = Date.now() - startTime;
      this.metrics.requestDurations.push(duration);
      
      logger.info('Request completed', { 
        ...requestLog, 
        status: response.status,
        duration 
      });
      
      return response;
    } catch (error) {
      this.metrics.errorsTotal++;
      logger.error('Upstream error', { 
        ...requestLog, 
        error: error.message 
      });
      
      return { status: 502, body: { error: 'Bad gateway' } };
    }
  }

  checkRateLimit(clientIp) {
    const windowMs = this.config.rateLimit?.windowMs || 60000;
    const max = this.config.rateLimit?.max || 100;
    
    const now = Date.now();
    const clientData = this.rateLimitStore.get(clientIp) || { count: 0, resetAt: now + windowMs };
    
    if (now > clientData.resetAt) {
      clientData.count = 0;
      clientData.resetAt = now + windowMs;
    }
    
    clientData.count++;
    this.rateLimitStore.set(clientIp, clientData);
    
    return clientData.count <= max;
  }

  findRoute(path) {
    for (const [routePath, config] of this.routes) {
      if (path.startsWith(routePath)) {
        return config;
      }
    }
    return null;
  }

  async forwardRequest(upstream, request) {
    const upstreamUrl = this.config.upstreams?.[upstream];
    if (!upstreamUrl) {
      throw new Error(`Unknown upstream: ${upstream}`);
    }
    
    return { 
      status: 200, 
      body: { forwarded: true, upstream },
      headers: {
        'X-Gateway-Timestamp': formatDate(new Date())
      }
    };
  }

  getHealth() {
    return {
      status: 'healthy',
      timestamp: formatDate(new Date()),
      routes: this.routes.size,
      upstreams: Object.keys(this.config.upstreams || {})
    };
  }

  getMetrics() {
    const avgDuration = this.metrics.requestDurations.length > 0
      ? this.metrics.requestDurations.reduce((a, b) => a + b, 0) / this.metrics.requestDurations.length
      : 0;

    return {
      timestamp: formatDate(new Date()),
      requests_total: this.metrics.requestsTotal,
      errors_total: this.metrics.errorsTotal,
      avg_request_duration_ms: avgDuration
    };
  }

  listen(port) {
    logger.info('Gateway listening', { port: port || this.config.port });
  }
}

export default ApiGateway;
