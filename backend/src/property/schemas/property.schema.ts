import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PropertyDocument = Property & Document;

export enum PropertyType {
  APARTMENT = 'apartment',
  VILLA = 'villa',
  TOWNHOUSE = 'townhouse',
  PENTHOUSE = 'penthouse',
  BUILDING = 'building',
  LAND = 'land',
}

export enum PropertyPurpose {
  SALE = 'sale',
  RENT = 'rent',
}

@Schema({ timestamps: true })
export class Property {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, type: Number })
  price: number;

  @Prop({ required: true, enum: PropertyType })
  type: PropertyType;

  @Prop({ required: true, enum: PropertyPurpose })
  purpose: PropertyPurpose;

  @Prop({ required: true })
  location: string;

  @Prop({ required: true })
  city: string;

  @Prop()
  area?: string;

  @Prop({ type: Number })
  bedrooms?: number;

  @Prop({ type: Number })
  bathrooms?: number;

  @Prop({ type: Number })
  parking?: number;

  @Prop({ type: Number })
  areaSize?: number;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop()
  contactName?: string;

  @Prop()
  contactPhone?: string;

  @Prop()
  contactEmail?: string;

  @Prop({ required: true })
  userId: string;
}

export const PropertySchema = SchemaFactory.createForClass(Property);

// Search-only indexes for filterable/searchable fields
PropertySchema.index({ purpose: 1 });
PropertySchema.index({ type: 1 });
PropertySchema.index({ city: 1 });
PropertySchema.index({ location: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ bedrooms: 1 });
PropertySchema.index({ bathrooms: 1 });
PropertySchema.index({ areaSize: 1 });
PropertySchema.index({ userId: 1 });
PropertySchema.index({ createdAt: -1 });

// Text index for full-text search on title and description
PropertySchema.index({ title: 'text', description: 'text' });

