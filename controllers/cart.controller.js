function cartController() { 
	return {
		index(req, res) {
			if(!req.session.cart) {
				return res.redirect('/menu');
			}
			res.render('shop/cart',{ pageTitle: 'Shopping Cart Detail',path: '/cart',});
		},
		update(req, res) {
			const { id, price } = req.body;
			// First time creating cart and adding basic object structure

			if(!req.session.cart) {
				req.session.cart = {
					items: {},
					totalQty: 0,
					totalPrice: 0,
					shippingCharge: 0,					
				}
			}
			let { cart } = req.session;
			if(!cart.items[id]) {
				cart.items[id] = {
					item: req.body,
					note: '',
					qty: 1,
					type: 'other',
				}
				cart.totalQty += 1;
				cart.totalPrice += parseFloat(price);
			}
			else {
				cart.items[id].qty += 1;
				//cart.totalQty +=1;
				cart.totalPrice += parseFloat(price);
				// cart.items[id].extraTopping = toppings;
				// cart.items[id].ingredient = ingredients;
			}
			
			return res.json({
				totalQty: cart.totalQty,
			});
		},
		updateQuantity(req, res) {
			const { id, price, quantity } = req.body;
			let { cart } = req.session;
			if(!cart.items[id]) {
				cart.items[id] = {
					item: req.body,
					qty: parseInt(quantity),
				}
				cart.items[id].totalQty += parseInt(quantity);
				cart.totalPrice += parseFloat(price);
			}else {
				cart.items[id].qty = parseInt(quantity);
				cart.items[id].totalQty +=parseInt(quantity);
				cart.totalPrice += parseFloat(price);
			}
			res.render('shop/cart-details', {
				pageTitle: 'Shop',
				path: '/',
				totalQty: cart.totalQty
			});
		},
		removeFromCart(req, res) {
			if(!req.session.cart) {
				return res.redirect('/menu');
			}
			const { key } = req.body
			 let { cart } = req.session;
			 cart.totalQty -= 1;
			 cart.totalPrice -= parseFloat(req.session.cart.items[key].item.price);
			 delete req.session.cart.items[key];
			res.render('shop/cart-details', {
				pageTitle: 'Shop',
				path: '/',
				totalQty: cart.totalQty
			});
		},
		updateNote(req, res){
			if(!req.session.cart) {
				return res.redirect('/menu');
			}
			const { cart } = req.session;
			let id = req.body.id;
			cart.items[id].note = req.body.note;
			return res.redirect('/cart');
		},		
		updateTotal(req, res) {
			const { price } = req.body;
			const { shipping } = req.body;
			let { cart } = req.session;	
			let total = 0
			// for (let productId in req.session.cart.items) {
			// 	total = total +req.session.cart.items[productId].item.price*req.session.cart.items[productId].qty;
			// }		
			cart.shippingCharge = parseFloat(shipping);
			return res.json({
				total: parseFloat(price).toFixed(2)
			});
		},
		removeDelivery(req, res) {
			let { cart } = req.session;	
			const { price } = req.body;
			let total = 0
			// for (let productId in req.session.cart.items) {
			// 	total = total +req.session.cart.items[productId].item.price*req.session.cart.items[productId].qty;
			// }		
			cart.shippingCharge = 0;
			cart.totalPrice = price;
			return res.json({
				total: parseFloat(price).toFixed(2)
			});
		},
		getNote(req, res){
			if(!req.session.cart) {
				return res.redirect('/menu');
			}
			const id = req.params.id;
			let { cart } = req.session;
			const test = cart.items[id].note;
			res.send(test);
		}
	}
}

module.exports = cartController;