import { Router } from 'express';
import {register , login, getMyConnectionRequests} from '../controllers/user.controller.js';
import multer from 'multer';
import { uploadProfilePicture , updateUserProfile , getUserAndProfile , updateProfileData ,getAllUserProfile , downloadFile,sendConnectionRequest, getUserGotConnectionRequests , acceptConnectionRequest } from '../controllers/user.controller.js';

const router = Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + '-' + file.originalname);
  }});

const upload = multer({ storage: storage });

router.route('/upload_profile_picture').post(upload.single('profile_picture'),uploadProfilePicture);

router.route('/register').post(register);
router.route('/login').post(login);
router.route('/user_update').post(updateUserProfile);
router.route('/get_user_and_profile').get(getUserAndProfile);
router.route('/update_Profile_Data').post(updateProfileData);
router.route('/user/get_all_user').get(getAllUserProfile);
router.route('/user/download_resume').get(downloadFile);
router.route('/user/send_connection_request').post(sendConnectionRequest);
router.route('/user/get_connection_requests').get(getMyConnectionRequests);
router.route('/user/get_user_got_connection_requests').get(getUserGotConnectionRequests);
router.route('/user/accept_connection_request').post(acceptConnectionRequest);



export default router;  