import { Injectable, LoggerService as NestLoggerService } from '@nestjs/common';
import * as winston from 'winston';
import * as DailyRotateFile from 'winston-daily-rotate-file';

@Injectable()
export class LoggerService implements NestLoggerService {
  private logger: winston.Logger;

  constructor() {
    const logFormat = winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      winston.format.json(),
    );

    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let msg = `${timestamp} [${level}]: ${message}`;
        if (Object.keys(meta).length > 0) {
          msg += ` ${JSON.stringify(meta)}`;
        }
        return msg;
      }),
    );

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      format: logFormat,
      defaultMeta: { service: 'bayut-api' },
      transports: [
        // Error log file
        new DailyRotateFile({
          filename: 'logs/error-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          level: 'error',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
        // Combined log file
        new DailyRotateFile({
          filename: 'logs/combined-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
          zippedArchive: true,
        }),
        // Console output
        new winston.transports.Console({
          format: consoleFormat,
        }),
      ],
      exceptionHandlers: [
        new DailyRotateFile({
          filename: 'logs/exceptions-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
      rejectionHandlers: [
        new DailyRotateFile({
          filename: 'logs/rejections-%DATE%.log',
          datePattern: 'YYYY-MM-DD',
          maxSize: '20m',
          maxFiles: '14d',
        }),
      ],
    });
  }

  log(message: string, context?: string | any) {
    const meta = typeof context === 'string' ? { context } : (context || {});
    this.logger.info(message, meta);
  }

  error(message: string, trace?: string | any, context?: string | any) {
    let meta: any = {};
    if (typeof trace === 'string' && typeof context === 'string') {
      meta = { trace, context };
    } else if (typeof trace === 'string') {
      meta = { trace };
    } else if (trace && typeof trace === 'object') {
      meta = trace;
    }
    if (typeof context === 'string') {
      meta.context = context;
    } else if (context && typeof context === 'object') {
      meta = { ...meta, ...context };
    }
    this.logger.error(message, meta);
  }

  warn(message: string, context?: string | any) {
    const meta = typeof context === 'string' ? { context } : (context || {});
    this.logger.warn(message, meta);
  }

  debug(message: string, context?: string | any) {
    const meta = typeof context === 'string' ? { context } : (context || {});
    this.logger.debug(message, meta);
  }

  verbose(message: string, context?: string | any) {
    const meta = typeof context === 'string' ? { context } : (context || {});
    this.logger.verbose(message, meta);
  }

  // Additional methods for structured logging
  info(message: string, meta?: any) {
    this.logger.info(message, meta || {});
  }

  http(message: string, meta?: any) {
    this.logger.http(message, meta || {});
  }
}


