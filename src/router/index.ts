import { Router } from 'express';
import authRouter from '../modules/auth/auth.router';
import contactRouter from '../modules/contact/contact.router';
import joinAsDeliveryPartnerRouter from '../modules/joinAsDeliveryPartner/joinAsDeliveryPartner.router';
import joinAsSellerRouter from '../modules/joinAsSeller/joinAsSeller.router';
import userRouter from '../modules/user/user.router';

const router = Router();

const moduleRoutes = [
  {
    path: '/user',
    route: userRouter,
  },
  {
    path: '/auth',
    route: authRouter,
  },
  {
    path: '/contact',
    route: contactRouter,
  },
  {
    path: '/joinAsSeller',
    route: joinAsSellerRouter,
  },
  {
    path: '/joinAsDeliveryPartner',
    route: joinAsDeliveryPartnerRouter,
  },
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
