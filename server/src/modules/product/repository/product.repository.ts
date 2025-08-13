import { PrismaClient, Product, Prisma, PropertyType, ProductStatus } from '@prisma/client';
import { CreateProductDto, UpdateProductDto, ProductImage, SearchProductParams } from '../dto/product.dto';

class ProductRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    return this.prisma.product.create({
      data: {
        title: data.title,
        description: data.description,
        price: data.price,
        area: data.area,
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        propertyType: data.propertyType as PropertyType,
        location: data.location,
        city: data.city,
        neighborhood: data.neighborhood,
        latitude: data.latitude,
        longitude: data.longitude,
        amenities: data.amenities,
        status: data.status as ProductStatus,
        agentId: data.agentId
      }
    });
  }

  async getProductById(id: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            isPrimary: true,
            productId: true
          }
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async getAllProducts(
    page: number, 
    limit: number, 
    filters: {
      priceMin?: number;
      priceMax?: number;
      propertyType?: PropertyType;
      city?: string;
      neighborhood?: string;
      status?: ProductStatus;
    }
  ): Promise<{ products: Product[], total: number }> {
    const where: Prisma.ProductWhereInput = {};
    
    if (filters.priceMin || filters.priceMax) {
      where.price = {
        gte: filters.priceMin,
        lte: filters.priceMax
      };
    }
    
    if (filters.propertyType) {
      where.propertyType = filters.propertyType;
    }
    
    if (filters.city) {
      where.city = filters.city;
    }
    
    if (filters.neighborhood) {
      where.neighborhood = filters.neighborhood;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          images: {
            where: { isPrimary: true },
            take: 1
          },
          agent: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      this.prisma.product.count({ where })
    ]);

    return { products, total };
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const updateData: Prisma.ProductUpdateInput = {};
    
    if (data.title) updateData.title = data.title;
    if (data.description) updateData.description = data.description;
    if (data.price) updateData.price = data.price;
    if (data.status) updateData.status = data.status as ProductStatus;

    return this.prisma.product.update({
      where: { id },
      data: updateData,
      include: {
        images: true,
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });
  }

  async deleteProduct(id: string): Promise<void> {
    await this.prisma.product.delete({
      where: { id }
    });
  }

  async searchProducts(params: SearchProductParams): Promise<Product[]> {
    const where: Prisma.ProductWhereInput = {};

    if (params.query) {
      where.OR = [
        { title: { contains: params.query, mode: 'insensitive' } },
        { description: { contains: params.query, mode: 'insensitive' } }
      ];
    }

    if (params.location) {
      where.location = { contains: params.location, mode: 'insensitive' };
    }

    if (params.minPrice || params.maxPrice) {
      where.price = {
        gte: params.minPrice,
        lte: params.maxPrice
      };
    }

    if (params.minArea || params.maxArea) {
      where.area = {
        gte: params.minArea,
        lte: params.maxArea
      };
    }

    if (params.propertyType) {
      where.propertyType = params.propertyType as PropertyType;
    }

    return this.prisma.product.findMany({
      where,
      include: {
        images: {
          where: { isPrimary: true },
          take: 1
        },
        agent: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      },
      take: 10,
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  async addImagesToProduct(productId: string, images: ProductImage[]): Promise<Product> {
    return this.prisma.product.update({
      where: { id: productId },
      data: {
        images: {
          createMany: {
            data: images.map(image => ({
              url: image.url,
              thumbnailUrl: image.thumbnailUrl,
              isPrimary: image.isPrimary
            }))
          }
        }
      },
      include: {
        images: true
      }
    });
  }
}

export default new ProductRepository();