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
				let totalAmount = 0;
				if(productId.type === 'deals'){
                    totalAmount = totalAmount + (productId.item.price * productId.qty);
                    if(productId.item.deals.length >0){
                        for(let items1 of Object.values(productId.item.deals)) {
                            let extraTopping = JSON.parse(items1).extraTopping ? JSON.parse(items1).extraTopping : [];

                            if(extraTopping.length >0){
                                for(let t of extraTopping) {
                                    let test1 = t.split(',');
                                    totalAmount +=parseFloat(test1[2]);
                                }
                            }						
                        }
                    }	
                }
                
                if(productId.type === 'other'){
                    console.log('test');
                    if (productId.item.toppings.length > 0) {				
                        let extraTopping = JSON.parse(productId.item.toppings);
                        for(let t of extraTopping) {
                            let test1 = t.split(',');
                            totalAmount +=parseFloat(test1[2]);
                        }
                    }
                    totalAmount = totalAmount + (productId.item.price * productId.qty);
                }
				//Retrieve price object from stripe API:
				const price = parseFloat(productId.item.price)* 100;
				const product =	productId.item.id;
				const productName = productId.item.itemName;
				const productImage = 'test2';
				const productPrice = parseFloat(productId.item.price) + totalAmount* 100;
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
				shipping_options: [
					{
					  shipping_rate_data: {
						type: 'fixed_amount',
						fixed_amount: {
						  amount: req.session.cart.shippingCharge *100,
						  currency: 'usd',
						},
						display_name: 'Delivery Charges',
					  }
					},
				  ],
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
			const {name, mobileNumber, email, address,city,postcode,ordertype,pickupType } = req.body;
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
				let count = 0;		
			for (let productId in req.session.cart.items) {
				count += req.session.cart.items[productId].qty;
			}
			let totalAmount = 0;
				for(let productId of Object.values(req.session.cart.items)) {
					if(productId.type === 'deals'){
						totalAmount = totalAmount + (productId.item.price * productId.qty);
						if(productId.item.deals.length >0){
							for(let items1 of Object.values(productId.item.deals)) {
								let extraTopping = JSON.parse(items1).extraTopping ? JSON.parse(items1).extraTopping : [];

								if(extraTopping.length >0){
									for(let t of extraTopping) {
										let test1 = t.split(',');
										totalAmount +=parseFloat(test1[2]);
									}
								}						
							}
						}	
					}
					
					if(productId.type === 'other'){
						console.log('test');
						if (productId.item.toppings.length > 0) {				
							let extraTopping = JSON.parse(productId.item.toppings);
							for(let t of extraTopping) {
								let test1 = t.split(',');
								totalAmount +=parseFloat(test1[2]);
							}
						}
						totalAmount = totalAmount + (productId.item.price * productId.qty);
					}
				}
			try {
				if(ordertype ==='delivery'){
					if(!city || !postcode) {
						req.flash('error', 'All fields are required.');
						return res.redirect('/checkout')
					}		
				}		
				req.session.order = {
					orderType: order_type,
				};

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
					address: address+','+city+','+postcode,
					creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
					role: 'USER'
				})
				if(ordertype ==='pickup' && pickupType==='pay_at_counter' || ordertype ==='delivery')
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
					var dt = new Date();
					newdate = dt.getFullYear() + '' + (((dt.getMonth() + 1) < 10) ? '0' : '') + (dt.getMonth() + 1) + '' + ((dt.getDate() < 10) ? '0' : '') + dt.getDate();
					const orderNumber = "O-"+newdate+"-0"+increasedNum;
					var orderDocRef = firestore.collection('orders').doc();	
					var deliveryTiming = year+"-"+month+"-"+day+" "+dateObj.getUTCHours()+":"+dateObj.getUTCMinutes()+":"+dateObj.getUTCSeconds()+"."+Math.floor(100000 + Math.random() * 900000);		
					
					orderDocRef.set({
						collected: 'No',            
						count: count.toString(),
						createdBy: name,
						creationByUid: '',
						creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
						customerName: name,
						customerAddress: address,
						customerPhoneNumber: mobileNumber,
						customerEmail: email,
						deliveryAmount: req.session.cart.shippingCharge.toString(),
						deliveryTiming: deliveryTiming,
						discountType: '',
						discountValue: '',
						documentId: orderDocRef.id,
						netAmount: totalAmount.toString(),
						price: totalAmount.toString(),
						orderForm: 'WEB',
						orderNumber: orderNumber,
						orderType: req.session.order.orderType,
						paidType:'PAY AT COUNTER',
						status: 'PENDING',
						tableNumber:''
					})
					
					for(let productId of Object.values(req.session.cart.items)) {
						let orderItemEntity = {};
						if(productId.type === 'deals'){
							let dealOrder = {};
						
							dealOrder['category'] = 'SPECIAL DEALS';
							dealOrder['count'] = '1';
							dealOrder['createdBy'] = 'User';
							dealOrder['creationByUid'] = '';
							dealOrder['creationDate'] = firebase1.firestore.FieldValue.serverTimestamp(),
							dealOrder['description'] = '';
							dealOrder['documentId'] = '3232';
							dealOrder['itemName'] = productId.item.itemName;
							dealOrder['orderId'] = orderDocRef.id;
							dealOrder['price'] = productId.item.price.toString();
						  
						  const { id } = await firestore.collection("dealorders").add(dealOrder);
						  dealOrder['documentId'] =  id;
						  firestore.collection("dealorders").doc(id).update(dealOrder);
							if(productId.item.deals.length >0){
								for(let items1 of Object.values(productId.item.deals)) {
									let dealorderItemEntity = {};
									dealorderItemEntity['category'] = 'STONE BAKED PIZZAS';
									dealorderItemEntity['count'] = 1;
									dealorderItemEntity['createdBy'] = '';
									dealorderItemEntity['creationByUid'] = '';
									dealorderItemEntity['creationDate'] = firebase1.firestore.FieldValue.serverTimestamp();
									dealorderItemEntity['dealId'] = id;
									dealorderItemEntity['discount'] = '0';
									dealorderItemEntity['documentId'] = '';
									dealorderItemEntity['note'] = '';
									dealorderItemEntity['orderId'] = orderDocRef.id;
									dealorderItemEntity['id'] = JSON.parse(items1).id;
									dealorderItemEntity['name'] =JSON.parse(items1).itemName;							
									dealorderItemEntity['extraTopping'] = JSON.parse(items1).extraTopping ? JSON.parse(items1).extraTopping : [];
									dealorderItemEntity['ingredient'] = JSON.parse(items1).ingredients ? JSON.parse(items1).ingredients : [];
									firestore.collection("dealorderitems").add(dealorderItemEntity).then((value)=> {
										dealorderItemEntity['documentId'] =  value.id
									firestore.collection("dealorderitems").doc(value.id).update(dealorderItemEntity);
									});								
								}
							}

						}
						if(productId.type ==='other'){
							orderItemEntity['category'] = productId.item.category;
							orderItemEntity['count'] = productId.qty;
							orderItemEntity['createdBy'] = '';
							orderItemEntity['creationByUid'] = '';					
							orderItemEntity['creationDate'] = firebase1.firestore.FieldValue.serverTimestamp();
							orderItemEntity['discount'] = '0';
							orderItemEntity['documentId'] = 'eR8ZGMykz7PJdimiL3Pe';					
							if (productId.item.toppings.length > 0) {				
								orderItemEntity['extraTopping'] = JSON.parse(productId.item.toppings);
							}else{
								orderItemEntity['extraTopping'] = [];
							}
							if (productId.item.ingredients.length > 0) {		
								orderItemEntity['ingredient'] = productId.item.ingredients.split('-');
							}else{
								orderItemEntity['ingredient'] = [];
							}
							orderItemEntity['name'] = productId.item.itemName;
							orderItemEntity['note'] = productId.note;
							orderItemEntity['orderId'] = orderDocRef.id;
							orderItemEntity['orderItemId'] = productId.item.id;
							orderItemEntity['price'] = productId.item.price;
							orderItemEntity['toppingLimit'] = "0";
							orderItemEntity['totalPrice'] = (parseFloat(productId.item.price) * productId.qty);

							const { id } = await firestore.collection("orderitems").add(orderItemEntity);
							orderItemEntity['documentId'] =  id;
							firestore.collection("orderitems").doc(id).update(orderItemEntity);
						}
					}
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