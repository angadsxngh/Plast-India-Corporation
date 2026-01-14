import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { registerUser, loginUser, logoutUser, changePassword, updateAccountDetails, sendRegistrationOTP, changeRole, getUser } from '../controllers/user.controller.js';

const router = Router();

router.route("/send-otp").post(sendRegistrationOTP)
router.route('/register').post(registerUser)
router.route('/login').post(loginUser)

//secured

router.route('/logout').get(verifyJWT, logoutUser)
router.route('/change-password').post(verifyJWT, changePassword)
router.route('/update-account-details').post(verifyJWT, updateAccountDetails)
router.route('/change-role/:id').put(verifyJWT, changeRole)
router.route('/user').get(verifyJWT, getUser)

export default router;