import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Property, Prisma, PropertyType, PropertyPurpose } from '@prisma/client';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { LoggerService } from '../common/logger/logger.service';
import { CacheService } from '../common/cache/cache.service';
import { CircuitBreakerService } from '../common/circuit-breaker/circuit-breaker.service';
import { RetryService } from '../common/retry/retry.service';
import { MetricsService } from '../common/metrics/metrics.service';

interface CircuitBreakerInstance {
  on(event: string, handler: (...args: any[]) => void): void;
  fire(...args: any[]): Promise<any>;
  status?: { state: string };
  enabled: boolean;
  stats: any;
}

@Injectable()
export class PropertyService {
  private dbBreaker: CircuitBreakerInstance;

  constructor(
    private prisma: PrismaService,
    private logger: LoggerService,
    private cacheService: CacheService,
    private circuitBreakerService: CircuitBreakerService,
    private retryService: RetryService,
    private metricsService: MetricsService,
  ) {
    this.dbBreaker = this.circuitBreakerService.createCircuitBreaker(
      async (operation: () => Promise<any>) => {
        return await this.retryService.retryWithBackoff(operation, {
          maxAttempts: 3,
          initialDelay: 1000,
          factor: 2,
        });
      },
      {
        name: 'property-db',
        timeout: 5000,
        errorThresholdPercentage: 50,
        resetTimeout: 30000,
      },
    );
  }

  async create(createPropertyDto: CreatePropertyDto & { userId?: string }): Promise<Property> {
    try {
      const { userId, ...propertyData } = createPropertyDto;
      
      if (!userId) {
        throw new Error('userId is required to create a property');
      }

      const property = await this.dbBreaker.fire(async () => {
        return this.prisma.property.create({
          data: {
            ...propertyData,
            userId,
          },
        });
      });
      
      this.logger.info(`Property created: ${property.id}`, {
        context: 'PropertyService',
        propertyId: property.id,
        title: property.title,
      });

      this.metricsService.incrementCounter('property.created');
      
      return property;
    } catch (error) {
      this.logger.error('Failed to create property', error.stack, {
        context: 'PropertyService',
      });
      this.metricsService.incrementCounter('property.create.errors');
      throw error;
    }
  }

  async findAll(filterDto?: FilterPropertyDto): Promise<{ data: Property[]; total: number; page: number; limit: number; totalPages: number }> {
    const startTime = Date.now();
    
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 12;
    const skip = (page - 1) * limit;

    const cacheKey = `properties:${JSON.stringify(filterDto || {})}`;

    try {
      const cached = await this.cacheService.get<{ data: Property[]; total: number; page: number; limit: number; totalPages: number }>(cacheKey);
      if (cached) {
        this.metricsService.recordMetric('property.cache.hit', 1);
        return cached;
      }

      this.metricsService.recordMetric('property.cache.miss', 1);

      const where: Prisma.PropertyWhereInput = {};

      if (filterDto) {
        if (filterDto.purpose) {
          where.purpose = filterDto.purpose;
        }

        if (filterDto.type) {
          where.type = filterDto.type;
        }

        if (filterDto.city) {
          where.city = filterDto.city;
        }

        if (filterDto.location) {
          where.location = filterDto.location;
        }

        if (filterDto.minPrice || filterDto.maxPrice) {
          where.price = {};
          if (filterDto.minPrice) {
            where.price.gte = filterDto.minPrice;
          }
          if (filterDto.maxPrice) {
            where.price.lte = filterDto.maxPrice;
          }
        }

        if (filterDto.bedrooms) {
          where.bedrooms = filterDto.bedrooms;
        }

        if (filterDto.bathrooms) {
          where.bathrooms = filterDto.bathrooms;
        }

        if (filterDto.minAreaSize || filterDto.maxAreaSize) {
          where.areaSize = {};
          if (filterDto.minAreaSize) {
            where.areaSize.gte = filterDto.minAreaSize;
          }
          if (filterDto.maxAreaSize) {
            where.areaSize.lte = filterDto.maxAreaSize;
          }
        }
      }

      const [total, properties] = await Promise.all([
        this.dbBreaker.fire(() => this.prisma.property.count({ where })),
        this.dbBreaker.fire(() =>
          this.prisma.property.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
        ),
      ]);

      const totalPages = Math.ceil(total / limit);

      const result = {
        data: properties,
        total,
        page,
        limit,
        totalPages,
      };

      await this.cacheService.set(cacheKey, result, 300);

      const duration = Date.now() - startTime;
      this.metricsService.recordMetric('property.query.duration', duration);
      this.metricsService.recordHistogram('property.query.duration', duration);
      this.metricsService.incrementCounter('property.queries.total');

      this.logger.info(`Properties fetched: ${properties.length} of ${total}`, {
        context: 'PropertyService',
        count: properties.length,
        total,
        page,
        limit,
        filters: filterDto,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.metricsService.recordMetric('property.query.error', 1);
      this.logger.error('Failed to fetch properties', error.stack, {
        context: 'PropertyService',
      });
      throw error;
    }
  }

  async findOne(id: string): Promise<Property | null> {
    const cacheKey = `property:${id}`;

    try {
      const cached = await this.cacheService.get<Property>(cacheKey);
      if (cached) {
        return cached;
      }

      const property = await this.dbBreaker.fire(() =>
        this.prisma.property.findUnique({ where: { id } })
      );

      if (!property) {
        this.logger.warn(`Property not found: ${id}`, {
          context: 'PropertyService',
        });
        throw new NotFoundException(`Property with ID ${id} not found`);
      }

      await this.cacheService.set(cacheKey, property, 600);

      return property;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to fetch property: ${id}`, error.stack, {
        context: 'PropertyService',
      });
      throw error;
    }
  }

  async update(id: string, updatePropertyDto: Partial<CreatePropertyDto>): Promise<Property | null> {
    try {
      const property = await this.dbBreaker.fire(() =>
        this.prisma.property.update({
          where: { id },
          data: updatePropertyDto,
        })
      );

      await this.cacheService.del(`property:${id}`);
      await this.cacheService.del('properties:*');

      this.logger.info(`Property updated: ${id}`, {
        context: 'PropertyService',
        propertyId: id,
      });

      this.metricsService.incrementCounter('property.updated');

      return property;
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`Property not found for update: ${id}`, {
          context: 'PropertyService',
        });
        throw new NotFoundException(`Property with ID ${id} not found`);
      }
      this.logger.error(`Failed to update property: ${id}`, error.stack, {
        context: 'PropertyService',
      });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.dbBreaker.fire(() =>
        this.prisma.property.delete({ where: { id } })
      );

      await this.cacheService.del(`property:${id}`);
      await this.cacheService.del('properties:*');

      this.logger.info(`Property deleted: ${id}`, {
        context: 'PropertyService',
        propertyId: id,
      });

      this.metricsService.incrementCounter('property.deleted');
    } catch (error: any) {
      if (error.code === 'P2025') {
        this.logger.warn(`Property not found for deletion: ${id}`, {
          context: 'PropertyService',
        });
        throw new NotFoundException(`Property with ID ${id} not found`);
      }
      this.logger.error(`Failed to delete property: ${id}`, error.stack, {
        context: 'PropertyService',
      });
      throw error;
    }
  }

  async getCities(): Promise<string[]> {
    try {
      const properties = await this.prisma.property.findMany({
        select: { city: true },
      });
      if (!Array.isArray(properties)) {
        return [];
      }
      return [...new Set(properties.map(p => p.city).filter(Boolean))];
    } catch (error) {
      this.logger.error('Failed to fetch cities', error.stack, {
        context: 'PropertyService',
      });
      return [];
    }
  }

  async getLocations(): Promise<string[]> {
    try {
      const properties = await this.prisma.property.findMany({
        select: { location: true },
      });
      if (!Array.isArray(properties)) {
        return [];
      }
      return [...new Set(properties.map(p => p.location).filter(Boolean))];
    } catch (error) {
      this.logger.error('Failed to fetch locations', error.stack, {
        context: 'PropertyService',
      });
      return [];
    }
  }

  async findByUserId(userId: string, filterDto?: FilterPropertyDto): Promise<{ data: Property[]; total: number; page: number; limit: number; totalPages: number }> {
    const startTime = Date.now();
    
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 12;
    const skip = (page - 1) * limit;

    const cacheKey = `properties:user:${userId}:${JSON.stringify(filterDto || {})}`;

    try {
      const cached = await this.cacheService.get<{ data: Property[]; total: number; page: number; limit: number; totalPages: number }>(cacheKey);
      if (cached) {
        this.metricsService.recordMetric('property.cache.hit', 1);
        return cached;
      }

      this.metricsService.recordMetric('property.cache.miss', 1);

      const where: Prisma.PropertyWhereInput = { userId };

      if (filterDto) {
        if (filterDto.purpose) {
          where.purpose = filterDto.purpose;
        }

        if (filterDto.type) {
          where.type = filterDto.type;
        }

        if (filterDto.city) {
          where.city = filterDto.city;
        }

        if (filterDto.location) {
          where.location = filterDto.location;
        }

        if (filterDto.minPrice || filterDto.maxPrice) {
          where.price = {};
          if (filterDto.minPrice) {
            where.price.gte = filterDto.minPrice;
          }
          if (filterDto.maxPrice) {
            where.price.lte = filterDto.maxPrice;
          }
        }

        if (filterDto.bedrooms) {
          where.bedrooms = filterDto.bedrooms;
        }

        if (filterDto.bathrooms) {
          where.bathrooms = filterDto.bathrooms;
        }

        if (filterDto.minAreaSize || filterDto.maxAreaSize) {
          where.areaSize = {};
          if (filterDto.minAreaSize) {
            where.areaSize.gte = filterDto.minAreaSize;
          }
          if (filterDto.maxAreaSize) {
            where.areaSize.lte = filterDto.maxAreaSize;
          }
        }
      }

      const [total, properties] = await Promise.all([
        this.dbBreaker.fire(() => this.prisma.property.count({ where })),
        this.dbBreaker.fire(() =>
          this.prisma.property.findMany({
            where,
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
          })
        ),
      ]);

      const totalPages = Math.ceil(total / limit);

      const result = {
        data: properties,
        total,
        page,
        limit,
        totalPages,
      };

      await this.cacheService.set(cacheKey, result, 300);

      const duration = Date.now() - startTime;
      this.metricsService.recordHistogram('property.query.duration', duration);

      this.logger.info(`User properties fetched: ${properties.length} of ${total} for user ${userId}`, {
        context: 'PropertyService',
        count: properties.length,
        total,
        page,
        limit,
        userId,
      });

      return result;
    } catch (error: any) {
      const duration = Date.now() - startTime;
      this.metricsService.recordMetric('property.query.error', 1);
      this.logger.error(`Failed to fetch user properties: ${userId}`, error.stack, {
        context: 'PropertyService',
      });
      throw error;
    }
  }
}
