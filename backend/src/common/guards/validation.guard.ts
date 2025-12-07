import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const { body, query, params } = request;

    // Validate body
    if (body && Object.keys(body).length > 0) {
      const dtoClass = this.getDtoClass(context);
      if (dtoClass) {
        const dto = plainToInstance(dtoClass, body);
        const errors = await validate(dto, {
          whitelist: true,
          forbidNonWhitelisted: true,
        });

        if (errors.length > 0) {
          const errorMessages = this.formatErrors(errors);
          throw new BadRequestException({
            statusCode: 400,
            message: 'Validation failed',
            errors: errorMessages,
          });
        }

        // Replace body with validated and transformed DTO
        request.body = dto;
      }
    }

    return true;
  }

  private getDtoClass(context: ExecutionContext): any {
    const handler = context.getHandler();
    const paramTypes = Reflect.getMetadata('design:paramtypes', handler) || [];
    
    // Try to find DTO class in parameter types
    for (const paramType of paramTypes) {
      if (paramType && paramType.prototype) {
        const prototype = paramType.prototype;
        // Check if it has validation decorators
        if (prototype.constructor && prototype.constructor.name.endsWith('Dto')) {
          return paramType;
        }
      }
    }
    
    return null;
  }

  private formatErrors(errors: any[]): any {
    const formatted: any = {};
    
    errors.forEach((error) => {
      const property = error.property;
      const constraints = error.constraints || {};
      
      formatted[property] = Object.values(constraints);
      
      // Handle nested validation errors
      if (error.children && error.children.length > 0) {
        formatted[property] = {
          ...formatted[property],
          ...this.formatErrors(error.children),
        };
      }
    });
    
    return formatted;
  }
}

