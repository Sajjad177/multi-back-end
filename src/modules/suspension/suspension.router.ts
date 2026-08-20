import { Router } from 'express';
import { auth, authenticate, requireSuspensionAccess } from '../../middleware/auth';
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
  requireSuspensionAccess,
  upload.array('appealDocuments', 5),
  validateRequest(suspensionValidation.submitAppealSchema),
  suspensionController.submitAppeal,
);

router.patch(
  '/:suspensionId/appeal-status',
  authenticate,
  auth(USER_ROLE.ADMIN),
  suspensionController.toggleAppealStatus,
);

const suspensionsRouter = router;
export default suspensionsRouter;
