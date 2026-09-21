import {Router} from 'express';
import activeCheck from '../controllers/post.controller';
const router = Router();


router.route('/').get(activeCheck);


export default router;