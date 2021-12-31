const Order = require('../models/order.model');
const firebase = require('../db')
const firestore = firebase.firestore();
const admin = require('firebase-admin');
const moment = require('moment');
const firebase1 = require('firebase');

function orderController(){
	return {
		async index(req, res) {
			// const orders = await Order.find({ 
			// 	customerId: req.user._id }, 
			// 	null, 
			// 	{
			// 		sort: {
			// 			'createdAt': -1,
			// 	}
			// });
			// res.header('Cache-Control', 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0')
			// res.render('customers/orders', { orders, moment })
		},
		async store(req, res) {
			let userEntity = {};
			// Validate request
			const {name, mobileNumber, email, address } = req.body;
			if(!mobileNumber || !address) {
				req.flash('error', 'All fields are required.');
				return res.redirect('/cart')
			}

			const phoneRegex = /^(\+\d{1,3}[- ]?)?\d{10}$/;
			const validPhone = phoneRegex.exec(mobileNumber);
			// Valid password
			if(!validPhone){
				req.flash('error', 'Phone Number is not valid');
				req.flash('name', name);
				req.flash('mobileNumber', mobileNumber);
				req.flash('address', address);
				req.flash('email', email);
				return res.redirect('/cart');
			}
			const data = req.body;

			userEntity['creationDate'] = firebase1.firestore.FieldValue.serverTimestamp();
			userEntity['name'] = name;
			userEntity['address'] = address;
			userEntity['mobileNumber'] = mobileNumber;
			userEntity['role'] = 'USER';
			return firebase.firestore().collection('users').add(userEntity)
			.then(function(docRef) {
				let count = 0
								
				//console.log(req.session.cart.items);
				for (let productId in req.session.cart.items) {
					count += req.session.cart.items[productId].qty;
				}
				
				try {
					// const orderID = firestore.collection("orders").add({
					// 	creationByUid: docRef.id,
					// 	count: count,
					// 	customerName: name,
					// 	customerPhoneNumber: mobileNumber,
					// 	customerAddress: address,
					// 	creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
					// 	price: req.session.cart.totalPrice,
					// 	status: 'PENDING'
					// })
					var orderDocRef = firestore.collection('orders').doc();
					orderDocRef.set({
						documentId: orderDocRef.id,
						creationByUid: docRef.id,
						count: count,
						customerName: name,
						customerPhoneNumber: mobileNumber,
						customerAddress: address,
						creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
						price: req.session.cart.totalPrice,
						status: 'PENDING'
					})
					.then(function(docRef) {
						let orderItemEntity = {};
						for(let productId of Object.values(req.session.cart.items)) {					
							orderItemEntity['createdBy'] = name;
							//orderItemEntity['creationByUid'] = docRef.id;
							orderItemEntity['orderId'] = orderDocRef.id;
							orderItemEntity['orderItemId'] = productId.item.id;
							orderItemEntity['count'] = productId.qty;
							orderItemEntity['name'] = productId.item.itemName;
							orderItemEntity['price'] = productId.item.price;
							orderItemEntity['totalPrice'] = productId.item.price * productId.qty;
							orderItemEntity['creationDate'] = firebase1.firestore.FieldValue.serverTimestamp();
							//console.log(orderItemEntity);
							firestore.collection("orderitems").add(orderItemEntity)
						}
						
						delete req.session.cart;
						return res.redirect('/customer/orders');
						//console.log('firestore add call complete. new entity has been created. order ID: ' + orderID);
					})
						.catch(function(error) {
							console.error("Error writing document: ", error);
					});
				} catch (error) {
					req.flash('error', 'Something went wrong!');
					return res.redirect('/cart');
				}

				
	
				// try {
				// 	const data = req.body;
				// 	await firestore.collection('students').doc().set(data);
				// 	res.send('Record saved successfuly');
				// } catch (error) {
				// 	res.status(400).send(error.message);
				// }
				// order.save().then(result => {
				// 	Order.populate(result, { path: 'customerId'}, (err, placedOrder) => {
				// 		req.flash('success', 'Order placed successfully');
				// 		delete req.session.cart;
				// 		const eventEmitter = req.app.get('eventEmitter');
				// 		eventEmitter.emit('orderPlaced', placedOrder);
				// 		return res.redirect('/customer/orders');
				// 	});
				// }).catch(err => {
				// 	req.flash('error', 'Something went wrong!');
				// 	return res.redirect('/cart');
				// });
			})
			.catch(function(error) {
				console.error("Error adding document: ", error);
			});
			
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