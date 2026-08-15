import { Router } from 'express';
import { optionalAuthenticate } from '../../middleware/auth';
import { upload } from '../../middleware/multer.middleware';
import JoinAsSellerController from './joinAsSeller.controller';

const router = Router();

router.post(
  '/',
  optionalAuthenticate,
  //   validateRequest(joinAsSellerValidation),
  //   auth(USER_ROLE.CUSTOMER, USER_ROLE.SELLER),
  upload.array('documents', 5),
  JoinAsSellerController.joinAsSeller,
);

const joinAsSellerRouter = router;
export default joinAsSellerRouter;
