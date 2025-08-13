import ProductRepository from '../repository/product.repository';
import { CreateProductDto, UpdateProductDto, SearchProductParams } from '../dto/product.dto';
import { Product } from '@prisma/client';
import { generateThumbnails } from '../../utils/imageProcessor';
import RecommendationService from '';

class ProductService {
  private productRepository: ProductRepository;
  private recommendationService: RecommendationService;

  constructor() {
    this.productRepository = new ProductRepository();
    this.recommendationService = new RecommendationService();
  }

  async createProduct(data: CreateProductDto): Promise<Product> {
    return this.productRepository.createProduct(data);
  }

  async getProductById(id: string): Promise<Product> {
    const product = await this.productRepository.getProductById(id);
    if (!product) {
      throw new Error('Product not found');
    }
    return product;
  }

  async getAllProducts(page: number, limit: number, filters: any): Promise<{ products: Product[], total: number }> {
    return this.productRepository.getAllProducts(page, limit, filters);
  }

  async updateProduct(id: string, data: UpdateProductDto): Promise<Product> {
    const product = await this.getProductById(id);
    return this.productRepository.updateProduct(id, data);
  }

  async deleteProduct(id: string): Promise<void> {
    await this.getProductById(id);
    return this.productRepository.deleteProduct(id);
  }

  async searchProducts(params: SearchProductParams): Promise<Product[]> {
    return this.productRepository.searchProducts(params);
  }

  async getRecommendations(userId: string): Promise<Product[]> {
    return this.recommendationService.getRecommendationsForUser(userId);
  }

  async uploadImages(productId: string, files: Express.Multer.File[]): Promise<Product> {
    const product = await this.getProductById(productId);
    
    // Process images (generate thumbnails, optimize, etc.)
    const processedImages = await Promise.all(
      files.map(async (file) => {
        const thumbnail = await generateThumbnails(file);
        return {
          url: file.path,
          thumbnailUrl: thumbnail.path,
          isPrimary: false // First image can be set as primary
        };
      })
    );

    // Update product with new images
    return this.productRepository.addImagesToProduct(productId, processedImages);
  }
}

export default ProductService;