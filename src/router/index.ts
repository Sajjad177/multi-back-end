import { Router } from 'express';
import userRouter from '../modules/user/user.router';
import authRouter from '../modules/auth/auth.router';
import contactRouter from '../modules/contact/contact.router';
import joinAsSellerRouter from '../modules/joinAsSeller/joinAsSeller.router';

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
];

moduleRoutes.forEach((route) => router.use(route.path, route.route));

export default router;
