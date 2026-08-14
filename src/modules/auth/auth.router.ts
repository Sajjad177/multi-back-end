import { Router } from 'express';
import authController from './auth.controller';
import validateRequest from '../../middleware/validateRequest';
import { authValidationSchema } from './auth.validation';
import { USER_ROLE } from '../user/user.constant';
import { loginLimiter } from '../../middleware/security';
import { auth, authenticate } from '../../middleware/auth';

const router = Router();

router.post(
  '/login',
  loginLimiter,
  validateRequest(authValidationSchema.authValidation),
  authController.login,
);

router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);

router.post(
  '/resend-forgot-otp',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  authController.resendForgotOtpCode,
);

router.post(
  '/verify-otp',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  authController.verifyOtp,
);

router.post(
  '/reset-password',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  authController.resetPassword,
);

router.post(
  '/change-password',
  authenticate,
  auth(USER_ROLE.ADMIN, USER_ROLE.CUSTOMER, USER_ROLE.SELLER, USER_ROLE.DELIVERY_PARTNER),
  authController.changePassword,
);

const authRouter = router;
export default authRouter;
