const express = require('express');
const menuController = require('../controllers/menuController');
const orderController = require('../controllers/orderController');
const waitCallController = require('../controllers/waitCallController');
const mediaController = require('../controllers/mediaController');
const debugController = require('../controllers/debugController');

const router = express.Router();

router.get('/category-items', menuController.getCategoryItems);

router.get('/orders', orderController.listOrders);
router.post('/orders', orderController.createOrder);
router.post('/orders/finalize/:table_number', orderController.finalizeOrders);
router.patch('/orders/:id/done', orderController.markOrderDone);
router.delete('/orders/:id', orderController.deleteOrderById);
router.delete('/orders', orderController.deleteOrdersByTable);

router.get('/order-history', orderController.listOrderHistory);
router.post('/order-history/session-delete', orderController.deleteOrderHistorySession);
router.delete('/order-history', orderController.deleteOrderHistorySession);
router.get('/kitchen-orders', orderController.listKitchenOrders);

router.post('/call-waiter', waitCallController.createWaitCall);
router.patch('/call-waiter/:id', waitCallController.updateWaitCallStatus);
router.delete('/call-waiter/attended', waitCallController.deleteAttendedWaitCalls);
router.delete('/call-waiter/:id', waitCallController.deleteWaitCall);
router.get('/call-waiter', waitCallController.listWaitCalls);

router.get('/proxy-image', mediaController.proxyImage);
router.get('/item-image/:itemId/:itemName', mediaController.getItemImage);

router.get('/debug/items', debugController.listMenuDebugData);

module.exports = router;