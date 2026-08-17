import { Router } from 'express';
import { auth, authenticate } from '../../middleware/auth';
import { upload } from '../../middleware/multer.middleware';
import validateRequest from '../../middleware/validateRequest';
import { USER_ROLE } from '../user/user.constant';
import suspensionController from './suspension.controller';
import { suspensionValidation } from './suspension.validation';

const router = Router();

router.post(
  '/',
  authenticate,
  auth(USER_ROLE.ADMIN),
  //   validateRequest(suspensionValidation.suspendUserSchema as AnyZodObject),
  suspensionController.suspendUser,
);

router.post(
  '/:suspensionId/appeal',
  authenticate,
  auth(USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  upload.array('appealDocuments', 5),
  validateRequest(suspensionValidation.submitAppealSchema),
  suspensionController.submitAppeal,
);

const suspensionsRouter = router;
export default suspensionsRouter;
