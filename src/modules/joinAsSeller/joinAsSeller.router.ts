import { Router } from 'express';
import { optionalAuthenticate } from '../../middleware/auth';
import { upload } from '../../middleware/multer.middleware';
import JoinAsSellerController from './joinAsSeller.controller';

const router = Router();

router.post(
  '/',
  optionalAuthenticate,
  upload.array('documents', 5),
  JoinAsSellerController.joinAsSeller,
);

router.get('/all', JoinAsSellerController.getAllJoinAsSellerApplications);
router.get('/:id', JoinAsSellerController.getJoinAsSellerApplicationById);

const joinAsSellerRouter = router;
export default joinAsSellerRouter;
