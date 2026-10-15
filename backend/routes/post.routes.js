import {Router} from 'express';
import {activeCheck, delete_comment_of_user, deletePost , get_comments_by_post, increment_likes} from '../controllers/post.controller.js';
import { createPost } from '../controllers/post.controller.js';
import multer from 'multer';
import {getAllPosts} from '../controllers/post.controller.js';
import { commentOnPost } from '../controllers/user.controller.js';

const router = Router();

const storage = multer.diskStorage({
    destination:(req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename:(req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({storage: storage});


router.route('/').get(activeCheck);

router.route('/post').post(upload.single('media'), createPost);
router.route('/posts').get(getAllPosts);
router.route('/delete_post').post(deletePost);
router.route('/comment').post(commentOnPost);
router.route('/get_comments').post(get_comments_by_post);
router.route('/delete_comment').post(delete_comment_of_user);
router.route('/increment_post_like').post(increment_likes);



export default router;