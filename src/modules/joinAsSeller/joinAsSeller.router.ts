import { Router } from 'express';
import { auth, authenticate, optionalAuthenticate } from '../../middleware/auth';
import { upload } from '../../middleware/multer.middleware';
import { USER_ROLE } from '../user/user.constant';
import JoinAsSellerController from './joinAsSeller.controller';

const router = Router();

router.post(
  '/',
  optionalAuthenticate,
  upload.array('documents', 5),
  JoinAsSellerController.joinAsSeller,
);

router.post('/resend-setup-link', JoinAsSellerController.resendSellerSetupLink);

router.get(
  '/all',
  authenticate,
  auth(USER_ROLE.ADMIN),
  JoinAsSellerController.getAllJoinAsSellerApplications,
);
router.get(
  '/:id',
  authenticate,
  auth(USER_ROLE.ADMIN),
  JoinAsSellerController.getJoinAsSellerApplicationById,
);

router.patch(
  '/:id/status',
  authenticate,
  auth(USER_ROLE.ADMIN),
  JoinAsSellerController.updateJoinAsSellerApplicationStatus,
);

const joinAsSellerRouter = router;
export default joinAsSellerRouter;
