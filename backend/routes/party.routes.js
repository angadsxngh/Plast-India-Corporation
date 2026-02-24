import { Router } from 'express';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { 
    createParty, 
    getParties, 
    getPartyById, 
    updateParty, 
    deleteParty 
} from '../controllers/party.controller.js';

const router = Router();

// Add route-level logging middleware
router.use((req, res, next) => {
    console.log(`[PARTY ROUTES] ${req.method} ${req.path}`);
    next();
});

router.route('/create-party').post(verifyJWT, createParty);
router.route('/get-parties').get(verifyJWT, getParties);
router.route('/get-party/:id').get(verifyJWT, getPartyById);
router.route('/update-party/:id').put(verifyJWT, updateParty);
router.route('/delete-party/:id').delete(verifyJWT, deleteParty);

export default router;

