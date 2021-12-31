const LocalStrategy = require('passport-local').Strategy
const bcrypt = require('bcrypt');

function initialize(passport){
    const  authenticateUser = async (email, password, done) =>{
        if(user == null){
            return done(null, false, {message:'No User with that email'})
        }

        try{
            if(await bcrypt.compare(password,user.password)){
                return done(null,user)
            }else{
                return done(null, false, {message : 'Password incorrect'})
            }
        } catch(e){
            return done(e)
        }
    }
    passport.use(new LocalStrategy({usernameField: 'emial'},authenticateUser))
    passport.serializeUser((user,done)=>{})
    passport.deserializeUser((id,done)=>{})
}

module.exports = initialize