const express = require('express')
const app = express()
const path = require('path')
const dotenv= require('dotenv')
const session = require('express-session')
const flash = require('connect-flash');
const passport = require('./config/passport')

dotenv.config()
const db = require('./config/db')
const userRouter = require('./routes/userRouter')
const adminRouter = require('./routes/adminRouter')

//const {errorHandler} = require('./middlewares/auth');

db()


app.use(express.json())
app.use(express.urlencoded({extended:true}))

app.use(session({
    secret : process.env.SESSION_SECRET,
    resave : false,
    saveUninitialized : true,
    cookie : {
        secure : false,
        httpOnly : true,
        maxAge : 72*60*60*1000
    }
}))

app.use(flash());

app.use(passport.initialize())
app.use(passport.session())

app.use((req,res,next)=>{
    if(req.session.user){
        res.locals.user = req.session.user;

    }else{
        res.locals.user = null
    }
    next();
})





app.use((req,res,next)=>{
    res.set('cache-control','no-store')
    next()
})



app.set('view engine','ejs')
app.set('views',[path.join(__dirname,'views/user'),path.join(__dirname,'views/admin')])


app.use(express.static(path.join(__dirname,'public')))



app.use('/',userRouter)
app.use('/admin',adminRouter)



//app.use(errorHandler);


app.use("/*", async (req, res) => {
    try {
      
  
      res.render("page-404");
    } catch (error) {
      console.error("Error occurred while fetching cart data:", error);
     
    }
  });

const PORT =  process.env.PORT || 3000;
app.listen(PORT,()=> console.log(`Server running on ${PORT}`)
)




module.exports = app



























