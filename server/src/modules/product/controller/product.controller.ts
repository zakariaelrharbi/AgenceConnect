import { Request, Response } from 'express';
import ProductService from '../service/product.service';
import { validateCreateProduct, validateUpdateProduct } from '../validators/product.validators';
import productRepository from '../repository/product.repository'; // Add this import
// Use Express.Multer.File type for uploaded files
type MulterFile = Express.Multer.File;

// Define custom request interfaces to extend the Express Request type
interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
  };
}

interface FileUploadRequest extends Request {
  files?: MulterFile[];
}

class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  async createProduct(req: Request, res: Response) {
    try {
      const validatedData = validateCreateProduct(req.body);
      const product = await this.productService.createProduct(validatedData);
      res.status(201).json({ success: true, data: product });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ success: false, error: errorMessage });
    }
  }

  async getProductById(req: Request, res: Response) {
    try {
      const product = await this.productService.getProductById(req.params.id);
      res.status(200).json({ success: true, data: product });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(404).json({ success: false, error: errorMessage });
    }
  }

  async getAllProducts(req: Request, res: Response) {
    try {
      const { page = '1', limit = '10', filters } = req.query;
      const result = await this.productService.getAllProducts(
        parseInt(page as string),
        parseInt(limit as string),
        filters ? JSON.parse(filters as string) : {}
      );
      res.status(200).json({ 
        success: true, 
        data: result.products,
        meta: {
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            totalPages: Math.ceil(result.total / parseInt(limit as string))
          },
          total: result.total,
          filters_applied: filters ? Object.keys(JSON.parse(filters as string)) : []
        }
      });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async updateProduct(req: Request, res: Response) {
    try {
      const validatedData = validateUpdateProduct(req.body);
      const product = await this.productService.updateProduct(req.params.id, validatedData);
      res.status(200).json({ success: true, data: product });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ success: false, error: errorMessage });
    }
  }

  async deleteProduct(req: Request, res: Response) {
    try {
      await this.productService.deleteProduct(req.params.id);
      res.status(204).end();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(400).json({ success: false, error: errorMessage });
    }
  }

  async searchProducts(req: Request, res: Response) {
    try {
      const { query, location, minPrice, maxPrice, minArea, maxArea, propertyType } = req.query;
      const products = await this.productService.searchProducts({
        query: query as string,
        location: location as string,
        minPrice: minPrice ? parseInt(minPrice as string) : undefined,
        maxPrice: maxPrice ? parseInt(maxPrice as string) : undefined,
        minArea: minArea ? parseInt(minArea as string) : undefined,
        maxArea: maxArea ? parseInt(maxArea as string) : undefined,
        propertyType: propertyType as string
      });
      res.status(200).json({ success: true, data: products });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
    }
  }

  async getRecommendations(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, error: 'Unauthorized' });
        return;
      }
      
      const userId = req.user.id;
      const recommendations = await this.productService.getRecommendations(userId);
      res.status(200).json({ success: true, data: recommendations });
      return;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      res.status(500).json({ success: false, error: errorMessage });
      return;
    }
  }

   async uploadImages(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) throw new Error('Unauthorized');
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const productId = req.params.id;
      const files = req.files as Express.Multer.File[];
      
      // Process files and save to database
      const imageData = files.map(file => ({
        url: `/uploads/products/${file.filename}`,
        thumbnailUrl: `/uploads/products/thumbnails/${file.filename}`,
        isPrimary: false
      }));

      // Save to database using your repository
      const updatedProduct = await productRepository.addImagesToProduct(productId, imageData);
      
      return res.status(200).json(updatedProduct);
    } catch (error) {
      console.error('Upload error:', error);
      return res.status(500).json({ error: 'Failed to upload images' });
    }
  }
}

export default new ProductController();