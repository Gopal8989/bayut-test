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

export interface Property {
  id: string | number;
  _id?: string; // MongoDB _id field
  title: string;
  description: string;
  price: number;
  type: PropertyType;
  purpose: PropertyPurpose;
  location: string;
  city: string;
  area?: string;
  bedrooms?: number;
  bathrooms?: number;
  parking?: number;
  areaSize?: number;
  images?: string[];
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  createdAt: string;
  updatedAt: string;
}

export interface FilterParams {
  purpose?: PropertyPurpose;
  type?: PropertyType;
  city?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  bedrooms?: number;
  bathrooms?: number;
  minAreaSize?: number;
  maxAreaSize?: number;
  page?: number;
  limit?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

