const Order = require('../models/order.model');
const firebase = require('../db')
const firestore = firebase.firestore();
const admin = require('firebase-admin');
const moment = require('moment');
const firebase1 = require('firebase');
const stripe = require('stripe')('sk_test_51IPNeKFk1sSnNf4DkRZGbskzdeEvFihcGoP65Pyo96Zk791WEeahF7HNG875upr6mZ7yCvCgiR3bxeGKqd01I8Jr00Idp4MbEJ');
function orderController(){
	return {
		async index(req, res) {
		const products = req.session.cart.items;
			if(!req.session.cart) {
				return res.redirect('/menu');
			}
			
			const lineItems = [];
			for(let productId of Object.values(req.session.cart.items)) {	
				//Retrieve price object from stripe API:
				const price = parseFloat(productId.item.price)* 100;
				const product =	productId.item.id;
				const productName = productId.item.itemName;
				const productImage = 'test2';
				const productPrice = parseFloat(productId.item.price)* 100;
				const productQuantity = productId.qty;
				lineItems.push({
					price_data: {
						currency: 'usd',
						product_data: {
							name: productName,
							images: [productImage],
						},
						unit_amount: productPrice,
					},
					quantity: productQuantity,
				});
			}
			const session = await stripe.checkout.sessions.create({
				payment_method_types: ['card'],
				line_items: lineItems,
				mode: 'payment',
				success_url: req.protocol + '://' + req.get('host') + '/checkout/success', // => http://localhost:3000
				cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel'
			});
			res.render('shop/orders', {
			path: '/checkout',
			pageTitle: 'orders',
			sessionId: session.id
			});
		},
		async store(req, res) {
			let userEntity = {};
			// Validate request
			const {name, mobileNumber, email, address,ordertype,pickupType } = req.body;
			let order_type = '';
			if(ordertype === 'pickup'){
				order_type = 'PICKUP';
			}else if(ordertype ==='delivery'){
				order_type = 'DELIVERY';
			}

			if(!mobileNumber) {
				req.flash('error', 'All fields are required.');
				return res.redirect('/checkout')
			}

			// const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
			// const validPhone = phoneRegex.exec(mobileNumber);
			// // Valid Phonenumber
			// if(!validPhone){
			// 	req.flash('error', 'Phone Number is not valid');
			// 	req.flash('name', name);
			// 	req.flash('mobileNumber', mobileNumber);
			// 	req.flash('address', address);
			// 	req.flash('email', email);
			// 	return res.redirect('/checkout');
			// }
			const data = req.body;
				let count = 0
								
			for (let productId in req.session.cart.items) {
				count += req.session.cart.items[productId].qty;
			}
			 
			try {
				let userDocRef = firestore.collection('users').doc();
				req.session.user_id = userDocRef.id
				req.session.user = userDocRef.id;
				req.session.order = {
					orderType: order_type,
				};
				userDocRef.set({
					documentId: userDocRef.id,
					creationByUid: userDocRef.id,
					name: name,
					mobileNumber: mobileNumber,
					address: address,
					creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
					role: 'USER'
				})
				if(ordertype ==='pickup' && pickupType==='pay_at_counter')
				{
					const lastOneRes = await firestore.collection('orders').orderBy('creationDate', 'desc').limit(1).get();
					let ordrNo = '';
					lastOneRes.forEach(doc => {
						ordrNo = doc.data().orderNumber;
					});

					const pieces = ordrNo.split(/[\s-]+/)
					const last = pieces[pieces.length - 1]
					let increasedNum = Number(last) + 1;
					var dateObj = new Date();
					var month = dateObj.getUTCMonth() + 1; //months from 1-12
					var day = dateObj.getUTCDate();
					var year = dateObj.getUTCFullYear();
					
					newdate = year+""+month+""+day;
					const orderNumber = "O-"+newdate+"-0"+increasedNum;
					var orderDocRef = firestore.collection('orders').doc();	
									
					orderDocRef.set({
						collected: 'No',            
						count: count,
						createdBy: name,
						creationByUid: userDocRef.id,
						creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
						customerAddress: address,
						customerName: name,
						customerPhoneNumber: mobileNumber,
						deliveryAmount: '',
						deliveryTiming: firebase1.firestore.FieldValue.serverTimestamp(),
						documentId: orderDocRef.id,
						orderFrom: 'WEB',
						orderNumber: orderNumber,
						orderType: req.session.order.orderType,
						paidType:'PAY AT COUNTER',
						price: req.session.cart.totalPrice.toString(),
						status: 'PENDING',
						tableNumber:''
					})

					
					let orderItemEntity = {};
					for(let productId of Object.values(req.session.cart.items)) {	
						orderItemEntity['count'] = productId.qty;				
						orderItemEntity['createdBy'] = name;
						orderItemEntity['creationByUid'] = userDocRef.id;
						orderItemEntity['creationDate'] = firebase1.firestore.FieldValue.serverTimestamp();
						orderItemEntity['discount'] = '';
						orderItemEntity['name'] = productId.item.itemName;
						orderItemEntity['note'] = productId.note;
						orderItemEntity['orderId'] = orderDocRef.id;
						orderItemEntity['orderItemId'] = productId.item.id;	
						orderItemEntity['price'] = productId.item.price.toString();;
						orderItemEntity['totalPrice'] = (productId.item.price * productId.qty).toString();;
						firestore.collection("orderitems").add(orderItemEntity)
					}
					
					await firestore.collection('users').doc(userDocRef.id).delete();

					delete req.session.cart;
					return res.redirect('/order/confirm');
				}
					return res.redirect('/customer/orders');
			} catch (error) {
				req.flash('error', 'Something went wrong!');
				return res.redirect('/cart');
			}
	
		},
		async show(req, res) {
			const { id } = req.params;
			const order = await Order.findById({ _id: id});
			// Authorize customer
			if(req.user._id.toString() === order.customerId.toString()) {
				return res.render('customers/singleOrder', { order });
			}
			else {
				return res.redirect('/');
			}
		}
	}
}

module.exports = orderController;