if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();

}
console.log(process.env.secret);


const express = require("express");
const app = express();
const path = require("path");
const Campground = require("./models/campground");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate");
const ExpressError = require("./utils/ExpressError");
const catchAsync = require('./utils/catchAsync');
const Joi = require('joi');
const session = require('express-session');
const MongoStore = require('connect-mongo')
const { campgroundSchema, reviewSchema } = require('./schemas.js');
const flash = require('connect-flash');
const Review = require('./models/review');
app.use(methodOverride('_method'));
const passport = require("passport");
const LocalStrategy = require('passport-local');
const User = require('./models/user.js');
const mongoSanitize = require('express-mongo-sanitize');
const helmet = require('helmet');
const campgroundRoutes = require('./routes/campgrounds');
const reviewRoutes = require('./routes/reviews');
const userRoutes = require('./routes/users');

const mongoose = require('mongoose');

const dbUrl = process.env.DB_URL;
// process.env.DB_URL
// "mongodb://127.0.0.1:27017/yelp-camp"

mongoose.connect(dbUrl, { useNewUrlParser: true, useUnifiedTopology: true });

const db = mongoose.connection;
db.on("error", console.error.bind(console, "Connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
})
app.engine('ejs', ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const store = MongoStore.create({
    mongoUrl: dbUrl,
    touchAfter: 24 * 60 * 60,
    crypto: {
        secret: 'thisismysecret'
    }
});
store.on('error', err => {console.log('error: ' + err)});

const sessionConfig = {
    store,
    name:'YCS',
    secret: "thisismysecret",
    resave: false,
    saveUninitialized: true,
    cookie: {
        httpOnly:true,
        // secure:true,
        expires: Date.now() + (1000 * 60 * 60 * 24 * 7),
        maxAge: 1000 * 60 * 60 * 24 * 7,
    }
}
app.use(session(sessionConfig));
app.use(flash());
app.use(mongoSanitize({
    replaceWith:'_'
}));
app.use(helmet({contentSecurityPolicy: false}));


// ---------------------------------------------------------------------------------------------------------------------------- 



app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


//--------------------------------------------------------------------------------------------------------------------------------------------------
app.use((req, res, next) => {

    res.locals.currentUser = req.user;
    res.locals.success = req.flash('success');
    res.locals.error = req.flash('error');
    next();

})

app.use('/', userRoutes)

app.use('/campgrounds', campgroundRoutes)

app.use('/campgrounds/:id/reviews', reviewRoutes)

app.get("/", (req, res) => {
    console.log("Yelp camp is openning!");
    res.render("home")
})
// app.get('/makecampground', async (req, res) => {
//     const camp = new Campground({ title: "My Backyard camp", description: "none", price: 5 });
//     await camp.save();
//     res.send(camp);
// })


// ------------------------------Error Handling-----------------------------------
app.all('*', (req, res, next) => {
    next(new ExpressError('Page not found', 404));
})
app.use((err, req, res, next) => {
    const { statusCode = 500, message = 'Server side error' } = err;
    res.status(statusCode).render('error', { err });
})



app.listen(3000, () => {
    console.log("Listening on port 3000...");
})
