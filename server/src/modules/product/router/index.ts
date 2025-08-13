import { Router, Response, NextFunction } from 'express';
import ProductController from '../controller/product.controller';
import { authenticateToken, authorizeRoles } from '../../../middleware/auth.middleware';
import { upload } from '../../../config/multer';
import { validateCreateProduct, validateUpdateProduct } from '../validators/product.validators';
import { AuthRequest } from '../../../middleware/auth.middleware';

const router = Router();

// Public routes
router.get('/', ProductController.getAllProducts);
router.get('/search', ProductController.searchProducts);
router.get('/:id', ProductController.getProductById);

// Authenticated routes
router.use(authenticateToken);

// Client routes (any authenticated user)
router.get('/recommendations/me', ProductController.getRecommendations);

// Agent/Admin routes
router.post(
  '/',
  authorizeRoles('agent', 'admin'),
  validateCreateProduct,
  ProductController.createProduct
);

router.put(
  '/:id',
  authorizeRoles('agent', 'admin'),
  validateUpdateProduct,
  ProductController.updateProduct
);

router.delete(
  '/:id',
  authorizeRoles('agent', 'admin'),
  ProductController.deleteProduct
);

// File upload route with proper error handling
router.post(
  '/:id/images',
  authorizeRoles('agent', 'admin'),
  (req: AuthRequest, res: Response, next: NextFunction) => {
    upload.array('images', 10)(req, res, (err: any) => {
      if (err) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ error: 'File too large. Max 5MB allowed' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({ error: 'Too many files. Max 10 allowed' });
        }
        if (err.message.includes('Invalid file type')) {
          return res.status(400).json({ error: err.message });
        }
        return res.status(500).json({ error: 'File upload failed' });
      }
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }
      return next();
    });
  },
  ProductController.uploadImages
);


export default router;