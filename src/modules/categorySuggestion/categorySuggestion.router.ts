import { Router } from 'express';
import categorySuggestionController from './categorySuggestion.controller';
import { auth, authenticate } from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';
import validateRequest from '../../middleware/validateRequest';
import { categorySuggestionValidation } from './categorySuggestion.validation';

const router = Router();

router.post(
  '/',
  authenticate,
  auth(USER_ROLE.SELLER),
  categorySuggestionController.suggestCategory,
);

router.patch(
  '/review/:suggestionId',
  authenticate,
  auth(USER_ROLE.ADMIN),
  validateRequest(categorySuggestionValidation.reviewCategorySuggestionValidationSchema),
  categorySuggestionController.reviewCategorySuggestion,
);

const categorySuggestionRouter = router;
export default categorySuggestionRouter;
