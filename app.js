const path = require('path');
const express = require('express');
const session = require('express-session')
const flash = require('express-flash');
const FirestoreStore = require('firestore-store')(session);
const firebase = require('firebase-admin');
const bodyParser = require('body-parser');
const config = require('./config');
const errorController = require('./controllers/error');
const app = express();

const bcrypt = require('bcrypt');
const passport = require('passport');
const initializePassport = require('./passport-config');
initializePassport(
    passport,
    email => users.find(user=>user.email === email)
)
const users = [];

const ref = firebase.initializeApp({
  credential: firebase.credential.cert('serviceAccountCredentials.json'),
  databaseURL: 'https://brutecorp-codeigniter-default-rtdb.firebaseio.com'
});
app.set('view engine', 'ejs');
app.set('views', 'views');

const shopRoutes = require('./routes/shop');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  next();
});
app.use(flash());
app.use(session({
  store: new FirestoreStore({
       database: firebase.firestore(),
       collection: 'sessions'
  }),
  secret: 'My secret',
  resave: true,
  saveUninitialized: true,
  cookie: {maxAge : 8*60*60*1000,
           secure: false,
           httpOnly: false }
}));
app.use(passport.initialize());
app.use(passport.session());

// Global middleware
app.use((req, res, next) => {
	res.locals.session = req.session;
	res.locals.user = req.user;
	next();
})
app.use(bodyParser.json());
app.use(shopRoutes);


function checkAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next;
  }
  res.redirect("/login");
}

app.use(errorController.get404);

app.listen(config.port, () => console.log(`App is listening on url http://localhost:${config.port}`));
