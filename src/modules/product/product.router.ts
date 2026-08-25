import { Router } from 'express';
import { auth, authenticate } from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import { upload } from '../../middleware/multer.middleware';
import productController from './product.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  auth(USER_ROLE.SELLER),
  upload.array('images', 5),
  //   validateRequest(createProductValidationSchema),
  productController.addNewProduct,
);

router.get('/all', productController.getAllProducts);

const productRouter = router;
export default productRouter;
