import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Property, PropertyDocument, PropertyType, PropertyPurpose } from './schemas/property.schema';
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
    @InjectModel(Property.name)
    private propertyModel: Model<PropertyDocument>,
    private logger: LoggerService,
    private cacheService: CacheService,
    private circuitBreakerService: CircuitBreakerService,
    private retryService: RetryService,
    private metricsService: MetricsService,
  ) {
    // Initialize circuit breaker for database operations
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

  async create(createPropertyDto: CreatePropertyDto): Promise<PropertyDocument> {
    try {
      // Use circuit breaker for database operation
      const property = await this.dbBreaker.fire(() => {
        const property = new this.propertyModel(createPropertyDto);
        return property.save();
      });

      // Invalidate cache - clear all property caches
      // Note: Pattern matching requires Redis. For in-memory cache, we track keys separately.
      // In production, use Redis for pattern-based invalidation.
      
      this.logger.info(`Property created: ${property._id}`, {
        context: 'PropertyService',
        propertyId: property._id.toString(),
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

  async findAll(filterDto?: FilterPropertyDto): Promise<{ data: PropertyDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const startTime = Date.now();
    
    // Pagination defaults
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 12;
    const skip = (page - 1) * limit;

    const cacheKey = `properties:${JSON.stringify(filterDto || {})}`;

    try {
      // Try cache first
      const cached = await this.cacheService.get<{ data: PropertyDocument[]; total: number; page: number; limit: number; totalPages: number }>(cacheKey);
      if (cached) {
        this.metricsService.recordMetric('property.cache.hit', 1);
        return cached;
      }

      this.metricsService.recordMetric('property.cache.miss', 1);

      const query: any = {};

      if (filterDto) {
        if (filterDto.purpose) {
          query.purpose = filterDto.purpose;
        }

        if (filterDto.type) {
          query.type = filterDto.type;
        }

        if (filterDto.city) {
          query.city = filterDto.city;
        }

        if (filterDto.location) {
          query.location = filterDto.location;
        }

        if (filterDto.minPrice || filterDto.maxPrice) {
          query.price = {};
          if (filterDto.minPrice) {
            query.price.$gte = filterDto.minPrice;
          }
          if (filterDto.maxPrice) {
            query.price.$lte = filterDto.maxPrice;
          }
        }

        if (filterDto.bedrooms) {
          query.bedrooms = filterDto.bedrooms;
        }

        if (filterDto.bathrooms) {
          query.bathrooms = filterDto.bathrooms;
        }

        if (filterDto.minAreaSize || filterDto.maxAreaSize) {
          query.areaSize = {};
          if (filterDto.minAreaSize) {
            query.areaSize.$gte = filterDto.minAreaSize;
          }
          if (filterDto.maxAreaSize) {
            query.areaSize.$lte = filterDto.maxAreaSize;
          }
        }
      }

      // Get total count for pagination
      const total = await this.dbBreaker.fire(() =>
        this.propertyModel.countDocuments(query).exec(),
      );

      // Use circuit breaker for database operation with pagination
      const properties = await this.dbBreaker.fire(() =>
        this.propertyModel
          .find(query)
          .sort({ createdAt: -1 }) // Sort by newest first
          .skip(skip)
          .limit(limit)
          .exec(),
      );

      const totalPages = Math.ceil(total / limit);

      const result = {
        data: properties,
        total,
        page,
        limit,
        totalPages,
      };

      // Cache results for 5 minutes
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

  async findOne(id: string): Promise<PropertyDocument | null> {
    const cacheKey = `property:${id}`;

    try {
      // Try cache first
      const cached = await this.cacheService.get<PropertyDocument>(cacheKey);
      if (cached) {
        return cached;
      }

      // Use circuit breaker for database operation
      const property = await this.dbBreaker.fire(() =>
        this.propertyModel.findById(id).exec(),
      );

      if (!property) {
        this.logger.warn(`Property not found: ${id}`, {
          context: 'PropertyService',
        });
        throw new NotFoundException(`Property with ID ${id} not found`);
      }

      // Cache for 10 minutes
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

  async update(id: string, updatePropertyDto: Partial<CreatePropertyDto>): Promise<PropertyDocument | null> {
    try {
      // Use circuit breaker for database operation
      const property = await this.dbBreaker.fire(() =>
        this.propertyModel.findByIdAndUpdate(id, updatePropertyDto, { new: true }).exec(),
      );

      if (!property) {
        this.logger.warn(`Property not found for update: ${id}`, {
          context: 'PropertyService',
        });
        throw new NotFoundException(`Property with ID ${id} not found`);
      }

      // Invalidate cache
      await this.cacheService.del(`property:${id}`);
      await this.cacheService.del('properties:*');

      this.logger.info(`Property updated: ${id}`, {
        context: 'PropertyService',
        propertyId: id,
      });

      this.metricsService.incrementCounter('property.updated');

      return property;
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to update property: ${id}`, error.stack, {
        context: 'PropertyService',
      });
      throw error;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      // Use circuit breaker for database operation
      const property = await this.dbBreaker.fire(() =>
        this.propertyModel.findByIdAndDelete(id).exec(),
      );

      if (!property) {
        this.logger.warn(`Property not found for deletion: ${id}`, {
          context: 'PropertyService',
        });
        throw new NotFoundException(`Property with ID ${id} not found`);
      }

      // Invalidate cache
      await this.cacheService.del(`property:${id}`);
      await this.cacheService.del('properties:*');

      this.logger.info(`Property deleted: ${id}`, {
        context: 'PropertyService',
        propertyId: id,
      });

      this.metricsService.incrementCounter('property.deleted');
    } catch (error: any) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Failed to delete property: ${id}`, error.stack, {
        context: 'PropertyService',
      });
      throw error;
    }
  }

  async getCities(): Promise<string[]> {
    const properties = await this.propertyModel.find().select('city').exec();
    return [...new Set(properties.map(p => p.city).filter(Boolean))];
  }

  async getLocations(): Promise<string[]> {
    const properties = await this.propertyModel.find().select('location').exec();
    return [...new Set(properties.map(p => p.location).filter(Boolean))];
  }

  async findByUserId(userId: string, filterDto?: FilterPropertyDto): Promise<{ data: PropertyDocument[]; total: number; page: number; limit: number; totalPages: number }> {
    const startTime = Date.now();
    
    // Pagination defaults
    const page = filterDto?.page || 1;
    const limit = filterDto?.limit || 12;
    const skip = (page - 1) * limit;

    const cacheKey = `properties:user:${userId}:${JSON.stringify(filterDto || {})}`;

    try {
      // Try cache first
      const cached = await this.cacheService.get<{ data: PropertyDocument[]; total: number; page: number; limit: number; totalPages: number }>(cacheKey);
      if (cached) {
        this.metricsService.recordMetric('property.cache.hit', 1);
        return cached;
      }

      this.metricsService.recordMetric('property.cache.miss', 1);

      const query: any = { userId };

      if (filterDto) {
        if (filterDto.purpose) {
          query.purpose = filterDto.purpose;
        }

        if (filterDto.type) {
          query.type = filterDto.type;
        }

        if (filterDto.city) {
          query.city = filterDto.city;
        }

        if (filterDto.location) {
          query.location = filterDto.location;
        }

        if (filterDto.minPrice || filterDto.maxPrice) {
          query.price = {};
          if (filterDto.minPrice) {
            query.price.$gte = filterDto.minPrice;
          }
          if (filterDto.maxPrice) {
            query.price.$lte = filterDto.maxPrice;
          }
        }

        if (filterDto.bedrooms) {
          query.bedrooms = filterDto.bedrooms;
        }

        if (filterDto.bathrooms) {
          query.bathrooms = filterDto.bathrooms;
        }

        if (filterDto.minAreaSize || filterDto.maxAreaSize) {
          query.areaSize = {};
          if (filterDto.minAreaSize) {
            query.areaSize.$gte = filterDto.minAreaSize;
          }
          if (filterDto.maxAreaSize) {
            query.areaSize.$lte = filterDto.maxAreaSize;
          }
        }
      }

      // Get total count for pagination
      const total = await this.dbBreaker.fire(() =>
        this.propertyModel.countDocuments(query).exec(),
      );

      // Use circuit breaker for database operation with pagination
      const properties = await this.dbBreaker.fire(() =>
        this.propertyModel
          .find(query)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit)
          .exec(),
      );

      const totalPages = Math.ceil(total / limit);

      const result = {
        data: properties,
        total,
        page,
        limit,
        totalPages,
      };

      // Cache for 5 minutes
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

