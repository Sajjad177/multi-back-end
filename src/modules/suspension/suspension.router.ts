import { Router } from 'express';
import { auth, authenticate } from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import suspensionController from './suspension.controller';

const router = Router();

router.post(
  '/',
  authenticate,
  auth(USER_ROLE.ADMIN),
  //   validateRequest(suspensionValidation.suspendUserSchema as AnyZodObject),
  suspensionController.suspendUser,
);

const suspensionsRouter = router;
export default suspensionsRouter;
