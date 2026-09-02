import { Router } from 'express';
import productListingController from './productListing.controller';
import { auth, authenticate } from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';

const router = Router();

router.post('/', authenticate, auth(USER_ROLE.SELLER), productListingController.addProductListing);
router.get('/all', productListingController.getAllProductListings);
router.get('/:productListingId', productListingController.getSingleProductListing);
router.put(
  '/:productListingId',
  authenticate,
  auth(USER_ROLE.SELLER),
  productListingController.updateProductListing,
);

const productListingRouter = router;
export default productListingRouter;
