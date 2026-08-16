import { Router } from 'express';
import { auth, authenticate, optionalAuthenticate } from '../../middleware/auth';
import { upload } from '../../middleware/multer.middleware';
import { USER_ROLE } from '../user/user.constant';
import JoinAsDeliveryPartnerController from './joinAsDeliveryPartner.controller';

const router = Router();

router.post(
  '/',
  optionalAuthenticate,
  upload.array('documents', 5),
  JoinAsDeliveryPartnerController.joinAsDeliveryPartner,
);

router.post('/resend-setup-link', JoinAsDeliveryPartnerController.resendDeliveryPartnerSetupLink);
router.get(
  '/all',
  authenticate,
  auth(USER_ROLE.ADMIN),
  JoinAsDeliveryPartnerController.getAllJoinAsDeliveryPartnerApplications,
);
router.get(
  '/:id',
  authenticate,
  auth(USER_ROLE.ADMIN),
  JoinAsDeliveryPartnerController.getJoinAsDeliveryPartnerApplicationById,
);
router.patch(
  '/:id/status',
  authenticate,
  auth(USER_ROLE.ADMIN),
  JoinAsDeliveryPartnerController.updateJoinAsDeliveryPartnerApplicationStatus,
);
router.post('/setup-password/:token', JoinAsDeliveryPartnerController.setupDeliveryPartnerPassword);

const joinAsDeliveryPartnerRouter = router;
export default joinAsDeliveryPartnerRouter;
