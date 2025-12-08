import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { join } from 'path';
import { NestExpressApplication } from '@nestjs/platform-express';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
// Import CommonJS modules using require to avoid TypeScript transformation issues
// eslint-disable-next-line @typescript-eslint/no-var-requires
const helmet = require('helmet');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const compression = require('compression');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const rateLimit = require('express-rate-limit');
import { LoggerService } from './common/logger/logger.service';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { PerformanceInterceptor } from './common/interceptors/performance.interceptor';
import { MetricsService } from './common/metrics/metrics.service';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  
  // Get logger service
  const loggerService = app.get(LoggerService);
  app.useLogger(loggerService);
  
  // Security: Helmet for HTTP headers
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));
  
  // Compression middleware
  app.use(compression());
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use('/api/', limiter);
  
  // Stricter rate limiting for auth endpoints
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5, // limit each IP to 5 requests per windowMs
    message: 'Too many authentication attempts, please try again later.',
    skipSuccessfulRequests: true,
  });
  app.use('/api/auth/', authLimiter);
  
  // Global validation pipe with enhanced security
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    transformOptions: {
      enableImplicitConversion: true,
    },
    disableErrorMessages: process.env.NODE_ENV === 'production',
    validationError: {
      target: false,
      value: false,
    },
  }));
  
  // Get metrics service
  const metricsService = app.get(MetricsService);
  
  // Global interceptors
  app.useGlobalInterceptors(
    new LoggingInterceptor(loggerService),
    new PerformanceInterceptor(metricsService),
  );
  
  // Global exception filter
  app.useGlobalFilters(new HttpExceptionFilter(loggerService));
  
  // Serve static files from uploads directory
  app.useStaticAssets(join(__dirname, '..', 'uploads'), {
    prefix: '/uploads/',
  });
  
  // Enhanced CORS configuration
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || ['http://localhost:3000'];
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps, Postman, or server-to-server)
      if (!origin) {
        return callback(null, true);
      }
      
      // In development, allow all origins
      if (isDevelopment) {
        return callback(null, true);
      }
      
      // In production, check against allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Log blocked origin for debugging
      loggerService.warn(`CORS blocked origin: ${origin}`, {
        allowedOrigins,
        isDevelopment,
      });
      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept'],
    exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  
  // Trust proxy for rate limiting behind reverse proxy
  app.set('trust proxy', 1);
  
  const port = process.env.PORT || 3001;

  // Swagger API Documentation
  const config = new DocumentBuilder()
    .setTitle('Bayut Clone API')
    .setDescription('Real Estate Platform API Documentation with advanced security, circuit breaker, caching, and monitoring features')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Authentication', 'User authentication endpoints')
    .addTag('Properties', 'Property management endpoints')
    .addTag('Health', 'Health check and monitoring endpoints')
    .addServer('http://localhost:3001', 'Development server')
    .addServer('https://api.bayut-clone.com', 'Production server')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Bayut Clone API Documentation',
    customCss: '.swagger-ui .topbar { display: none }',
  });

  loggerService.log(`📚 Swagger docs available at http://localhost:${port}/api-docs`, 'Bootstrap');
  await app.listen(port);
  
  loggerService.log(`🚀 Backend server running on http://localhost:${port}`, 'Bootstrap');
  loggerService.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`, 'Bootstrap');
}
bootstrap();

