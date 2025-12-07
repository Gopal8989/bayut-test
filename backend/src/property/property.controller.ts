import { Controller, Get, Post, Body, Param, Put, Delete, Query, UseGuards, UseInterceptors, UploadedFiles, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { PropertyService } from './property.service';
import { CreatePropertyDto } from './dto/create-property.dto';
import { FilterPropertyDto } from './dto/filter-property.dto';
import { ContactPropertyDto } from './dto/contact-property.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadService } from '../upload/upload.service';
import { EmailService } from '../email/email.service';

@ApiTags('Properties')
@Controller('properties')
export class PropertyController {
  constructor(
    private readonly propertyService: PropertyService,
    private readonly uploadService: UploadService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(FilesInterceptor('images', 10))
  @HttpCode(HttpStatus.CREATED)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Create a new property',
    description: 'Create a new property listing. Requires authentication. Supports image uploads.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreatePropertyDto })
  @ApiResponse({
    status: 201,
    description: 'Property successfully created',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - validation error',
  })
  async create(
    @Body() createPropertyDto: CreatePropertyDto,
    @UploadedFiles() files?: Express.Multer.File[],
    @Req() req?: any,
  ) {
    if (files && files.length > 0) {
      const imageUrls = await this.uploadService.saveMultipleFiles(files);
      createPropertyDto.images = imageUrls;
    }

    if (req?.user?.id) {
      (createPropertyDto as any).userId = req.user.id;
    }

    const property = await this.propertyService.create(createPropertyDto);

    if (createPropertyDto.contactEmail) {
      const emailResult = await this.emailService.sendPropertyListingEmail(
        createPropertyDto.contactEmail,
        property.title,
      );
      if (!emailResult) {
        console.warn(`Property listing email failed to send to: ${createPropertyDto.contactEmail}`);
      }
    }

    return this.transformProperty(property);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all properties',
    description: 'Retrieve a paginated list of properties with optional filtering by purpose, type, location, price, etc.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of properties retrieved successfully',
    schema: {
      example: {
        data: [],
        total: 100,
        page: 1,
        limit: 12,
        totalPages: 9,
      },
    },
  })
  findAll(@Query() filterDto: FilterPropertyDto) {
    return this.propertyService.findAll(filterDto).then(result => ({
      ...result,
      data: result.data.map(property => this.transformProperty(property)),
    }));
  }

  @Get('my-properties')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get my properties',
    description: 'Retrieve a paginated list of properties created by the authenticated user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of user properties retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  findMyProperties(@Query() filterDto: FilterPropertyDto, @Req() req: any) {
    return this.propertyService.findByUserId(req.user.id, filterDto).then(result => ({
      ...result,
      data: result.data.map(property => this.transformProperty(property)),
    }));
  }

  @Get('cities')
  @ApiOperation({
    summary: 'Get all cities',
    description: 'Retrieve a list of all unique cities where properties are located',
  })
  @ApiResponse({
    status: 200,
    description: 'List of cities retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Dubai', 'Abu Dhabi', 'Sharjah'],
    },
  })
  getCities() {
    return this.propertyService.getCities();
  }

  @Get('locations')
  @ApiOperation({
    summary: 'Get all locations',
    description: 'Retrieve a list of all unique locations/areas where properties are located',
  })
  @ApiResponse({
    status: 200,
    description: 'List of locations retrieved successfully',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Downtown Dubai', 'Business Bay', 'Marina'],
    },
  })
  getLocations() {
    return this.propertyService.getLocations();
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get property by ID',
    description: 'Retrieve detailed information about a specific property',
  })
  @ApiParam({
    name: 'id',
    description: 'Property ID (MongoDB ObjectId)',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 200,
    description: 'Property details retrieved successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found',
  })
  findOne(@Param('id') id: string) {
    return this.propertyService.findOne(id).then(property => 
      property ? this.transformProperty(property) : null
    );
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update property',
    description: 'Update an existing property. Requires authentication and ownership.',
  })
  @ApiParam({
    name: 'id',
    description: 'Property ID to update',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: CreatePropertyDto })
  @ApiResponse({
    status: 200,
    description: 'Property successfully updated',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found',
  })
  update(@Param('id') id: string, @Body() updatePropertyDto: Partial<CreatePropertyDto>) {
    return this.propertyService.update(id, updatePropertyDto).then(property => 
      property ? this.transformProperty(property) : null
    );
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete property',
    description: 'Delete a property. Requires authentication and ownership.',
  })
  @ApiParam({
    name: 'id',
    description: 'Property ID to delete',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({
    status: 204,
    description: 'Property successfully deleted',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found',
  })
  remove(@Param('id') id: string) {
    return this.propertyService.remove(id);
  }

  @Post('contact')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Contact property agent',
    description: 'Send an inquiry message to the property agent',
  })
  @ApiBody({ type: ContactPropertyDto })
  @ApiResponse({
    status: 200,
    description: 'Inquiry sent successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Property not found',
  })
  async contactProperty(@Body() contactDto: ContactPropertyDto) {
    const property = await this.propertyService.findOne(contactDto.propertyId);
    
    if (!property) {
      throw new Error('Property not found');
    }

    if (!property.contactEmail) {
      throw new Error('Contact email not available for this property');
    }

    try {
      const emailResult = await this.emailService.sendPropertyInquiryEmail(
        property.contactEmail,
        property.title,
        contactDto.name,
        contactDto.email,
        contactDto.phone || '',
        contactDto.message,
      );
      
      if (!emailResult) {
        console.warn('Email not sent - SMTP may not be configured');
      }
    } catch (error) {
      console.error('Failed to send inquiry email:', error);
    }

    return {
      message: 'Your inquiry has been sent successfully. The agent will contact you soon.',
      propertyId: contactDto.propertyId,
    };
  }

  private transformProperty(property: any): any {
    if (!property) return property;
    
    const transformed = property.toObject ? property.toObject() : { ...property };
    
    if (transformed._id) {
      transformed.id = transformed._id.toString();
      delete transformed._id;
    }
    
    return transformed;
  }
}

