const fs = require('fs');
const delivery = require("../data/delivery");
const category = require("../data/category");

// const admin = require("firebase-admin");
// const bucket = admin.storage().bucket('fir-pos-8e4e4.appspot.com');
const firebase = require('../db');
const Item = require('../models/item');
const Deal = require('../models/deal');
const Topping = require('../models/topping');
const ToppingCategory = require('../models/toppingcategory');
const nodemailer = require('nodemailer');
const Cart = require('../models/cart');
const PDFDocument = require('pdfkit');
const path = require('path');
const Category = require('../models/category');
const firestore = firebase.firestore();
const firebase1 = require('firebase');
const { check, validationResult } = require('express-validator');
const stripe = require('stripe')('sk_test_51IPNeKFk1sSnNf4DkRZGbskzdeEvFihcGoP65Pyo96Zk791WEeahF7HNG875upr6mZ7yCvCgiR3bxeGKqd01I8Jr00Idp4MbEJ');

const getIndex = async (req, res, next) => {
    res.render('shop/index', {
        pageTitle: 'Byford Pizzeria Online',
        path: '/'
    });
};

const getAllItems = async (req, res, next) => {
    try {
        const items = await firestore.collection('items');
        const deals = await firestore.collection('deals');
        const toppings = await firestore.collection('toppings');
        const toppingCategories = await firestore.collection('toppingCategories');
        const familyPack = await items.get();
        const specialDeals = await deals.get();
        const allToppings = await toppings.get();
        const allToppingCategories = await toppingCategories.get();

        const binsRef = await firestore.collection("toppingCategories").get();
        const binData = binsRef.docs.map(doc => doc.data());
        const binsInfoRef = await firestore.collection("toppings").get();
        const binInfoData = binsInfoRef.docs.map(doc => doc.data());
        const toppingData = binData.map(bin => {
            const { toppingCategoryName } = bin;
            const topping = binInfoData.filter(
                doc => doc.category === toppingCategoryName
            );
                return { ...bin, topping };
        });

        const familyPackArray = [];
        const toppingsArray = [];
        const specialDealsArray = [];
        const toppingCategoryArray = [];
        specialDeals.forEach(doc => {
            const deals = new Deal(
                doc.id,
                doc.data().category,                    
                doc.data().itemName,
                doc.data().images,
                doc.data().description,
                doc.data().isAvailable,
                doc.data().price,
                doc.data().drinkcount,
                doc.data().garliccount,
                doc.data().pastacount,
                doc.data().pizzacount,
            );
            specialDealsArray.push(deals);
        });
        familyPack.forEach(doc => {
            const family = new Item(
                doc.id,
                doc.data().category,                    
                doc.data().itemName,
                doc.data().category ==='STONE BAKED PIZZAS' ?doc.data().ingredients : [],
                [],
                doc.data().images,
                doc.data().description,
                doc.data().isAvailable,
                doc.data().price
            );
            familyPackArray.push(family);
        });
        allToppings.forEach(doc => {
            const topping = new Topping(
                doc.id,
                doc.data().category,                    
                doc.data().toppingName,
                doc.data().available,
                doc.data().price
            );
            toppingsArray.push(topping);
        });
        allToppingCategories.forEach(doc => {
            const toppingCategory = new ToppingCategory(
                doc.id,                   
                doc.data().toppingCategoryName
            );
            toppingCategoryArray.push(toppingCategory);
        });
        res.render('shop/product-list', {
            familyPack: familyPackArray,
            toppings: toppingData,
            specialDeals: specialDealsArray,
            toppingCategories: toppingCategoryArray,
            category: category,
            pageTitle: 'Byford Pizzeria Online Menu',
            path: '/products',
            hasItems: familyPack.length > 0,
            activeShop: true,
            productCSS: true
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
  }

// const getAllCategories = async (req, res, next) => {
//   try {
//       const categories = await firestore.collection('categories');
//       const data = await categories.get();
//       const catArray = [];
//       if(data.empty) {
//           res.status(404).send('No Categories record found');
//       }else {
//           data.forEach(doc => {
//               const item = new Category(
//                   doc.id,
//                   doc.data().categoryName
//               );
//               catArray.push(item);
//           });
//           res.render('includes/category', {
//             cats: catArray,
//             pageTitle: 'Shop',
//             path: '/includes/category',
//             hasItems: catArray.length > 0,
//             activeShop: true,
//             productCSS: true
//           });
//       }
//   } catch (error) {
//       res.status(400).send(error.message);
//   }
// }

const getItem = async (req, res, next) => {
  try {
      const id = req.params.id;
      const items = await firestore.collection('items').doc(id);
      const data = await items.get();
      if(!data.exists) {
          res.status(404).send('Item with the given ID not found');
      }else {
          res.send(data.data());
      }
  } catch (error) {
      res.status(400).send(error.message);
  }
}

const getItems = async (req, res, next) => {
    try {
        const { id, pizza,pasta, drink, garlic } = req.body;
        
        const pizzaItemsArray = [];
        const pastaItemsArray = [];
        const drinkItemsArray = [];
        const garlicItemsArray = [];

        const binsRef = await firestore.collection("toppingCategories").get();
        const binData = binsRef.docs.map(doc => doc.data());
        const binsInfoRef = await firestore.collection("toppings").get();
        const binInfoData = binsInfoRef.docs.map(doc => doc.data());
        const toppingData = binData.map(bin => {
            const { toppingCategoryName } = bin;
            const topping = binInfoData.filter(
                doc => doc.category === toppingCategoryName
            );
                return { ...bin, topping };
        });

        if(pizza > 0){
            const pizzas = await firestore.collection("items").where("category", "==", 'STONE BAKED PIZZAS')
            const pizzaItems = await pizzas.get();
            pizzaItems.forEach(doc => {
                const pizza = new Item(
                    doc.id,
                    doc.data().category,                    
                    doc.data().itemName,
                    doc.data().category ==='STONE BAKED PIZZAS' ?doc.data().ingredients : [],
                    [],
                    doc.data().images,
                    doc.data().description,
                    doc.data().isAvailable,
                    doc.data().price,
                    doc.data().toppingLimits,
                );
                pizzaItemsArray.push(pizza);
            });
        }
        
        if(pasta > 0){
            const pastas = await firestore.collection("items").where("category", "==", 'PASTA')
            const pastaItems = await pastas.get();
            pastaItems.forEach(doc => {
                const pasta = new Item(
                    doc.id,
                    doc.data().category,                    
                    doc.data().itemName,
                    [],
                    [],
                    doc.data().images,
                    doc.data().description,
                    doc.data().isAvailable,
                    doc.data().price,
                    doc.data().toppingLimits,
                );
                pastaItemsArray.push(pasta);
            });
        }

        if(drink > 0){
            const drinks = await firestore.collection("items").where("category", "==", 'DRINKS')
            const drinkItems = await drinks.get();
            drinkItems.forEach(doc => {
                const drink = new Item(
                    doc.id,
                    doc.data().category,                    
                    doc.data().itemName,
                    [],
                    [],
                    doc.data().images,
                    doc.data().description,
                    doc.data().isAvailable,
                    doc.data().price,
                    doc.data().toppingLimits
                );
                drinkItemsArray.push(drink);
            });
        }

        if(garlic > 0){
            const garlics = await firestore.collection("items").where("category", "==", 'SIDES')
            const garlicItems = await garlics.get();
            garlicItems.forEach(doc => {
                const garlic = new Item(
                    doc.id,
                    doc.data().category,                    
                    doc.data().itemName,
                    [],
                    [],
                    doc.data().images,
                    doc.data().description,
                    doc.data().isAvailable,
                    doc.data().price,
                    doc.data().toppingLimits
                );
                garlicItemsArray.push(garlic);
            });
        }

        res.render('shop/special-deals', {
            pizzaItems: pizzaItemsArray,
            pizzacount: pizza,
            pastaItems: pastaItemsArray,
            pastacount: pasta,
            drinkItems: drinkItemsArray,
            drinkcount: drink,
            garlicItems: garlicItemsArray,
            garliccount: garlic,
            toppings:toppingData,
            pageTitle: 'Shop',
            path: '/products',
            activeShop: true,
            productCSS: true
        });

    } catch (error) {
        res.status(400).send(error.message);
    }
  }

const specialDeals = async (req, res, next) => {
    try {
        
        let specialdeals  = req.body;
        
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
        let deals = JSON.parse(specialdeals.specialDeals);
        // let coke = JSON.parse(specialdeals.coke);
        let garlic = JSON.parse(specialdeals.garlic);
        let drink = JSON.parse(specialdeals.drink);
        let t1 = JSON.parse(deals); 
        let price = parseFloat(specialdeals.price);
        let id = specialdeals.id;
        var myJson = '';
        var test32 = [];
        t1.forEach((element, index, array) => {
            for (index = 0; index < element.toppings.length; index++) {
                var str = element.toppings[index];
                var arr = str.split(",");
                price += parseFloat(arr[2]);
            }
            myJson = JSON.stringify({'id':element.id,'itemName':element.itemName, 'price':element.price, 'extraTopping':element.toppings, 'ingredients':element.newingredients});
            test32.push(myJson);
        });

        test32.push(garlic);
        test32.push(drink);
        var mydeal = {'id':specialdeals.id,'itemName':specialdeals.itemName, 'price':price,'deals':test32};
        if(!cart.items[id]) {
            cart.items[id] = {
                item: mydeal,
                note: '',
                qty: 1,
                type: 'deals',
            }
            cart.totalQty += 1;
            cart.totalPrice += parseFloat(price);
        }
        else {
            cart.items[id].qty += 1;
            cart.totalPrice += parseFloat(price);
        }
       
        return res.json({
            totalQty: cart.totalQty,
        });
    } catch(error){

    }
}

const postCart = async (req, res, next) => {
    const prodId = req.body.productId;
    const items = await firestore.collection('items').doc(prodId);
    const data = await items.get();
};

const addNote = async (req, res, next) => {
    const ID = req.body.id;
    res.render('shop/add-note', {
        pageTitle: 'Shop',
        path: '/',
    });
}

const addToCart = async (req, res, next) => {
    const prodId = req.body.productId;
    const items = await firestore.collection('items').doc(prodId);
    const data = await items.get();
    Cart.save(data.data());
    res.redirect('/cart');
}

const getCart = async (req, res, next) => {
    res.render('shop/cart', { cart: Cart.getCart(), pageTitle: 'Byford Pizzeria Online Cart', path: '/cart', name: 'Edward' })
}

const getCheckout = async(req, res, next) => {
    if(!req.session.cart) {
        return res.redirect('/menu');
    }else if(req.session.cart && Object.values(req.session.cart.items) ==0){
        return res.redirect('/menu');
    }
    const { cart } = req.session;
    res.render('shop/checkout', { delivery: delivery, pageTitle: 'Byford Pizzeria Online Checkout', path: '/cart', name: 'Edward' })
};

const orderConfirm = async(req, res, next) => {
    res.render('shop/confirm', { cart: Cart.getCart(), pageTitle: 'Byford Pizzeria Online Confirm', path: '/shop', name: '' })
};

const getCheckoutSuccess = async(req, res, next) => {
    try {
        const {name, mobileNumber, email, address,ordertype } = req.body;
        let userDocRef = firestore.collection('users').doc();
        req.session.user_id = userDocRef.id
        const ordersRef = firestore.collection('orders');
        const  id = req.session.user;
        const users = await firestore.collection('users').doc(id);
        const data = await users.get();
        const lastOneRes = await ordersRef.orderBy('creationDate', 'desc').limit(1).get();

        var orderDocRef = firestore.collection('orders').doc();
        let count = 0
        for (let productId in req.session.cart.items) {
            count += req.session.cart.items[productId].qty;
        }
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
            const totalPrice = req.session.cart.shippingCharge+req.session.cart.totalPrice;
        orderDocRef.set({
            collected: 'No',            
            count: count,
            createdBy: data.data().name,
            creationByUid: id,
            creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
            customerAddress: data.data().address,
            customerName: data.data().name,
            customerPhoneNumber: data.data().mobileNumber,
            deliveryAmount: req.session.cart.shippingCharge.toString(),
            deliveryTiming: firebase1.firestore.FieldValue.serverTimestamp(),
            documentId: orderDocRef.id,
            orderFrom: 'WEB',
            orderNumber: orderNumber,
            orderType: req.session.order.orderType,
            paidType:'Stripe',
            price: totalPrice.toString(),
            status: 'PENDING',
            tableNumber:''
        })
        let orderItemEntity = {};
        for(let productId of Object.values(req.session.cart.items)) {					
            orderItemEntity['count'] = productId.qty;				
            orderItemEntity['createdBy'] = data.data().name;
            orderItemEntity['creationByUid'] = id;
            orderItemEntity['creationDate'] = firebase1.firestore.FieldValue.serverTimestamp();
            orderItemEntity['discount'] = '';
            orderItemEntity['name'] = productId.item.itemName;
            orderItemEntity['note'] = productId.note;
            orderItemEntity['orderId'] = orderDocRef.id;
            orderItemEntity['orderItemId'] = productId.item.id;	
            orderItemEntity['price'] = productId.item.price;
            orderItemEntity['totalPrice'] = productId.item.price * productId.qty;
           firestore.collection("orderitems").add(orderItemEntity)
        }
        await firestore.collection('users').doc(id).delete();
        delete req.session.cart;
        return res.redirect('/order/confirm');
    } catch (error) {
        req.flash('error', 'Something went wrong!');
        //return res.redirect('/cart');
    }
    
  };

const getInvoice = async (req, res, next) => {
    try {
        const orderId = req.params.orderId;
        const orderItems = await firestore.collection("orderitems").where("orderId", "==", 'uWdugFxWpuJ6HA9weBv6')
        .get()
        .then(function(querySnapshot) {
            const invoiceName = 'invoice-' + orderId + '.pdf';
            const invoicePath = path.join('data', 'invoices', invoiceName);

            const pdfDoc = new PDFDocument();
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader(
                'Content-Disposition',
                'inline; filename="' + invoiceName + '"'
            );
            pdfDoc.pipe(fs.createWriteStream(invoicePath));
            pdfDoc.pipe(res);

            pdfDoc.fontSize(26).text('Invoice', {
                underline: true
            });
            pdfDoc.text('-----------------------');
            let totalPrice = 0;

            querySnapshot.forEach(function(doc) {
                totalPrice += doc.data().count * doc.data().price;             
                pdfDoc
                    .fontSize(14)
                    .text(
                        doc.data().name +
                        ' - ' +
                        doc.data().count +
                        ' x ' +
                        '$' +
                        doc.data().price
                    );
            });
            pdfDoc.text('---');
            pdfDoc.fontSize(20).text('Total Price: $' + totalPrice);
            pdfDoc.end();
        })
        .catch(function(error) {
            console.log("Error getting documents: ", error);
        });
    } catch (error) {
        res.status(400).send(error.message);
    }
};

const contact = async(req, res, next) => {
    res.render('shop/contact', { cart: Cart.getCart(), pageTitle: 'Byford Pizzeria Online Contact', path: '/shop', name: '' })
};

const postContact = async (req, res, next) => {
    try {
        const {contact_name, contact_email,contact_phone,contact_message } = req.body;
        
        const transporter = nodemailer.createTransport({
            host: "smtp.mailtrap.io",
            port: 2525,
            auth: {
                user: "2fc78e5f49f076",
                pass: "8b3bb2cddd0377"
            }
        })
        const mailOptions = {
            from: req.body.contact_email,
            to: 'naveen.webadsmedia@gmail.com',
            subject: `Message from ${req.body.contact_email}:  Contact Us`,
            text:req.body.contact_message,
            html: `
            <strong>Name :</strong> ${req.body.contact_name} <br/>
            <strong>Email :</strong> ${req.body.contact_email} <br/>
            <strong>Phone :</strong> ${req.body.contact_phone} <br/>
            <strong>Message :</strong>${req.body.contact_message}`
        }

        transporter.sendMail(mailOptions ,(error,info)=>{
            if(error){
                console.log(error);
                res.send('error');
            }else{
                console.log('Email Sent'+info.response);
                res.send('success');
            }
        })
        res.send('success');
    } catch (error) {
        res.status(400).send(error.message);
    }
    
};

const postBooking = async (req, res, next) => {
    try {
        const {name, email,phone,booking_time,date,person } = req.body;
        await firestore.collection('bookings').doc().set({
            name:name,
            email:email,
            phone:phone,
            time:booking_time,
            date:date,
            person:person,
            creationDate: firebase1.firestore.FieldValue.serverTimestamp(),
        });

        res.send('success');
    } catch (error) {
        res.status(400).send(error.message);
    }
    
};

module.exports = {
  getAllItems,
  //getAllCategories,
  getItem,
  getItems,
  specialDeals,
  postCart,
  postContact,
  addToCart,
  addNote,
  getCart,
  getIndex,
  getCheckout,
  getCheckoutSuccess,
  orderConfirm,
  getInvoice,
  contact,
  postBooking
}

