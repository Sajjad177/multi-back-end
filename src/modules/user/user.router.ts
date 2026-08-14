import { Router } from 'express';
import userController from './user.controller';
import validateRequest from '../../middleware/validateRequest';
import { userValidation } from './user.validation';
import { USER_ROLE } from './user.constant';
import { upload } from '../../middleware/multer.middleware';
import { auth, authenticate } from '../../middleware/auth';

const router = Router();

router.post(
  '/register',
  validateRequest(userValidation.userValidationSchema),
  userController.registerUser,
);

router.post(
  '/verify-email',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  userController.verifyEmail,
);

router.post(
  '/resend-otp',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  userController.resendOtpCode,
);

router.get('/all-users', userController.getAllUsers);
router.get(
  '/my-profile',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  userController.getMyProfile,
);

router.put(
  '/update-profile',
  upload.single('image'),
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  userController.updateUserProfile,
);

router.get(
  '/admin_id',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  userController.getAdminId,
);

const userRouter = router;
export default userRouter;
