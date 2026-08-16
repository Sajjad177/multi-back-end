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

router.post('/resend-setup-link', JoinAsSellerController.resendSellerSetupLink);

router.get('/all', JoinAsSellerController.getAllJoinAsSellerApplications);
router.get('/:id', JoinAsSellerController.getJoinAsSellerApplicationById);

router.patch('/:id/status', JoinAsSellerController.updateJoinAsSellerApplicationStatus);

const joinAsSellerRouter = router;
export default joinAsSellerRouter;
