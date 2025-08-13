export interface CreateProductDto {
  title: string;
  description: string;
  price: number;
  area: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: string;
  location: string;
  city: string;
  neighborhood: string;
  latitude?: number;
  longitude?: number;
  amenities: string[];
  agentId: string;
  status: string;
}

export interface UpdateProductDto {
  title?: string;
  description?: string;
  price?: number;
  status?: 'AVAILABLE' | 'RESERVED' | 'SOLD' | 'RENTED' | 'OFF_MARKET';
}

export interface SearchProductParams {
  query?: string;
  location?: string;
  minPrice?: number;
  maxPrice?: number;
  minArea?: number;
  maxArea?: number;
  propertyType?: string;
}

export interface ProductImage {
  url: string;
  thumbnailUrl: string;
  isPrimary: boolean;
}