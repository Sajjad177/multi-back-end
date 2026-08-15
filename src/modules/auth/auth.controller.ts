import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import authService from './auth.service';
import { clearRefreshTokenCookie, setRefreshTokenCookie } from '../../helper/helper';

const login = catchAsync(async (req, res) => {
  const result = await authService.login(req.body);
  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'You have logged in successfully.',
    data: result,
  });
});

const logout = catchAsync(async (_req, res) => {
  clearRefreshTokenCookie(res);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Logged out successfully',
    data: null,
  });
});

const refreshToken = catchAsync(async (req, res) => {
  const { refreshToken } = req.cookies;
  const result = await authService.refreshToken(refreshToken);

  setRefreshTokenCookie(res, result.refreshToken);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Access token refreshed successfully',
    data: {
      accessToken: result.accessToken,
    },
  });
});

const forgotPassword = catchAsync(async (req, res) => {
  const { email } = req.body;
  const result = await authService.forgotPassword(email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'If an account exists with this email, a password reset OTP has been sent.',
    data: result,
  });
});

const resendForgotOtpCode = catchAsync(async (req, res) => {
  const { email } = req.user;
  await authService.resendForgotOtpCode(email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP resent successfully',
    // data: result,
  });
});

const verifyOtp = catchAsync(async (req, res) => {
  const { otp } = req.body;
  const { email } = req.user;
  const result = await authService.verifyOtp(email, otp);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'OTP verified successfully',
    data: result,
  });
});

const resetPassword = catchAsync(async (req, res) => {
  const { email } = req.user;
  const result = await authService.resetPassword(req.body, email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password reset successfully',
    data: result,
  });
});

const changePassword = catchAsync(async (req, res) => {
  const { email } = req.user;
  const result = await authService.changePassword(req.body, email);

  sendResponse(res, {
    statusCode: StatusCodes.OK,
    success: true,
    message: 'Password changed successfully',
    data: result,
  });
});

const authController = {
  login,
  refreshToken,
  forgotPassword,
  resendForgotOtpCode,
  verifyOtp,
  resetPassword,
  changePassword,
  logout,
};

export default authController;
