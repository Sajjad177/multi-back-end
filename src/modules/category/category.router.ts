import { Router } from 'express';
import categoryController from './category.controller';
import { upload } from '../../middleware/multer.middleware';
import { auth, authenticate } from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middleware/validateRequest';
import { categoryValidation } from './category.validation';

const router = Router();

router.post('/', upload.single('file'), categoryController.createNewCategory);
router.get('/all', categoryController.getAllCategories);
router.get('/:categoryId', categoryController.getSingleCategories);

router.patch(
  '/:categoryId',
  //   authenticate,
  //   auth(USER_ROLE.ADMIN),
  upload.single('image'),
  validateRequest(categoryValidation.updateCategoryValidationSchema),
  categoryController.updateCategory,
);

router.patch(
  '/:categoryId/toggle-status',
  //   authenticate,
  //   auth(USER_ROLE.ADMIN),
  categoryController.toggleCategoryStatus,
);

const categoryRouter = router;
export default categoryRouter;
