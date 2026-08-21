import { Router } from 'express';
import categorySuggestionController from './categorySuggestion.controller';
import { auth, authenticate } from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constant';

const router = Router();

router.post(
  '/',
  authenticate,
  auth(USER_ROLE.SELLER),
  categorySuggestionController.suggestCategory,
);

const categorySuggestionRouter = router;
export default categorySuggestionRouter;
