import { Router } from 'express';
import { upload } from '../middlewares/multer.middleware.js';
import { verifyJWT } from '../middlewares/auth.middleware.js';
import { createProduct, updateProduct, deleteProduct, createCategory, addProductToCategory, removeProductFromCategory, getCategories, getProducts, createPurchaseOrder, createSalesOrder, getPurchaseOrders, getSalesOrders, createDispatchOrder, getDispatchOrders, completeDispatchOrder, getPendency } from '../controllers/product.controller.js';

const router = Router();

router.route('/create-product').post(verifyJWT, createProduct);
router.route('/update-product/:id').put(verifyJWT, updateProduct);
router.route('/delete-product/:id').delete(verifyJWT, deleteProduct);
router.route('/create-category').post(verifyJWT, createCategory);
router.route('/add-product-to-category').post(verifyJWT, addProductToCategory);
router.route('/remove-product-from-category').post(verifyJWT, removeProductFromCategory);
router.route('/get-categories').get(verifyJWT, getCategories);
router.route('/get-products').get(verifyJWT, getProducts);
router.route('/create-purchase-order').post(verifyJWT, createPurchaseOrder);
router.route('/create-sales-order').post(verifyJWT, createSalesOrder);
router.route('/get-purchase-orders').get(verifyJWT, getPurchaseOrders);
router.route('/get-sales-orders').get(verifyJWT, getSalesOrders);
router.route('/create-dispatch-order').post(verifyJWT, createDispatchOrder);
router.route('/get-dispatch-orders').get(verifyJWT, getDispatchOrders);
router.route('/complete-dispatch-order/:id').put(verifyJWT, completeDispatchOrder);
router.route('/get-pendency').get(verifyJWT, getPendency);
export default router;