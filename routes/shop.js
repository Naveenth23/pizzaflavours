const path = require('path');

const express = require('express');

const shopController = require('../controllers/shop');
const cartController = require('../controllers/cart.controller')();
const orderController = require('../controllers/order.controller')();
const router = express.Router();

router.get('/', shopController.getIndex);
router.post('/', shopController.getAllItems);
// router.post('/cart', shopController.postCart);

router.get('/menu', shopController.getAllItems);

router.get('/item/:id', shopController.getItem);
//router.post('/update-cart', shopController.update);
//router.get('/cart', shopController.getCart);
router.post('/add-to-cart', shopController.addToCart);
router.get('/add-note', shopController.addNote);


router.get("/signup", function (req, res) {
    res.render("signup");
});


router.get('/cart', cartController.index);
router.post('/update-cart', cartController.update);
router.post('/update-total', cartController.updateTotal);
router.post('/remove-delivery', cartController.removeDelivery);
router.post('/update-quantity', cartController.updateQuantity);
router.post('/update-note', cartController.updateNote);
router.post('/cart-delete-item', cartController.removeFromCart);
router.get('/getnote/:id', cartController.getNote);
router.get('/checkout', shopController.getCheckout);
router.get('/checkout/success', shopController.getCheckoutSuccess);
router.get('/checkout/cancel', shopController.getAllItems);
router.get('/order/confirm', shopController.orderConfirm);
router.get('/orders/:orderId', shopController.getInvoice);
// Customer routes
router.post('/orders', orderController.store);
router.get('/customer/orders', orderController.index);
router.get('/customer/orders/:id', orderController.show);

router.get('/contact', shopController.contact);
router.post('/booking', shopController.postBooking);
router.post('/submitContact', shopController.postContact);

module.exports = router;
