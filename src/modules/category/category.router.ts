import { Router } from 'express';
import categoryController from './category.controller';
import { upload } from '../../middleware/multer.middleware';

const router = Router();

router.post('/', upload.single('file'), categoryController.createNewCategory);

const categoryRouter = router;
export default categoryRouter;
