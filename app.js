if (process.env.NODE_ENV !== "production") {
  require("dotenv").config();
}

const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const ejsMate = require("ejs-mate");
const session = require("express-session");
const flash = require("connect-flash");
const ExpressError = require("./utils/ExpressError");
const methodOverride = require("method-override");
const passport = require("passport");
const LocalStrategy = require("passport-local");
const User = require("./models/user");
const mongoSanitize = require("express-mongo-sanitize");
// const helmet = require("helmet");
const MongoDBStore = require("connect-mongo");

const userRoutes = require("./routes/users");
const campgroundRoutes = require("./routes/campgrounds");
const reviewRoutes = require("./routes/reviews");

const dbUrl = process.env.DB_URL || "mongodb://localhost:27017/yelpcampdb";

mongoose.connect(dbUrl, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Database Connected");
});
const app = express();

//views dir setup
app.engine("ejs", ejsMate);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

//to make work req.body, this line parse req.body
app.use(express.urlencoded({ extended: true }));
//to use put patch http method
app.use(methodOverride("_method"));
//to serve static file and setting public dir
app.use(express.static(path.join(__dirname, "public")));
//for mongo sanitizing
app.use(mongoSanitize({ replaceWith: "_" }));

const secret = process.env.SECRET || "thisshouldbeabettersecret";

//config to store session in cloud
//lazy session update read about this by docs
const store = new MongoDBStore({
  mongoUrl: dbUrl,
  secret,
  touchAfter: 24 * 60 * 60,
});

store.on("error", function (e) {
  console.log(e);
});

//setting up session middleware
const sessionConfig = {
  store, //now we can store session in cloud
  name: "session", //this store name of our session, previously it is connect.sid
  secret,
  resave: false,
  saveUninitialized: true,
  cookie: {
    httpOnly: true,
    // secure:true, //this break thing in our app but we want it, it allow to run/access only in https
    expires: Date.now() + 1000 * 60 * 60 * 24 * 7,
    maxAge: 1000 * 60 * 60 * 24 * 7,
  },
};
app.use(session(sessionConfig));

//setting up flash middleware
app.use(flash());

// app.use(helmet());

// const scriptSrcUrls = [
//   "https://stackpath.bootstrapcdn.com/",
//   "https://api.tiles.mapbox.com/",
//   "https://api.mapbox.com/",
//   "https://kit.fontawesome.com/",
//   "https://cdnjs.cloudflare.com/",
//   "https://cdn.jsdelivr.net",
// ];
// const styleSrcUrls = [
//   "https://kit-free.fontawesome.com/",
//   "https://stackpath.bootstrapcdn.com/",
//   "https://api.mapbox.com/",
//   "https://api.tiles.mapbox.com/",
//   "https://fonts.googleapis.com/",
//   "https://use.fontawesome.com/",
// ];
// const connectSrcUrls = [
//   "https://api.mapbox.com/",
//   "https://a.tiles.mapbox.com/",
//   "https://b.tiles.mapbox.com/",
//   "https://events.mapbox.com/",
// ];
// const fontSrcUrls = [];
// app.use(
//   helmet.contentSecurityPolicy({
//     directives: {
//       defaultSrc: [],
//       connectSrc: ["'self'", ...connectSrcUrls],
//       scriptSrc: ["'unsafe-inline'", "'self'", ...scriptSrcUrls],
//       styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
//       workerSrc: ["'self'", "blob:"],
//       objectSrc: [],
//       imgSrc: [
//         "'self'",
//         "blob:",
//         "data:",
//         "https://res.cloudinary.com/dxtrmcue8/", //SHOULD MATCH YOUR CLOUDINARY ACCOUNT!
//         "https://images.unsplash.com/",
//       ],
//       fontSrc: ["'self'", ...fontSrcUrls],
//     },
//   })
// );

//setting up passport middleware
app.use(passport.initialize());
//note app.use(session(sessionConfig)) use before
app.use(passport.session());
//here we are doing
//hello passport we want to use LocalStrategy and User model have authenticate method(this method is added by package)
passport.use(new LocalStrategy(User.authenticate()));
//how do u store user in session
passport.serializeUser(User.serializeUser());
//how do u get out of the session
passport.deserializeUser(User.deserializeUser());

//middleware to flash msg
//whatever we putting this way is available and can use everywhere throughout the app
app.use((req, res, next) => {
  //this is to get user everywhere we want
  //req.user give current user detail because of passport
  // console.log(req.session);
  // console.log(req.query);
  res.locals.currentUser = req.user;
  res.locals.success = req.flash("success");
  res.locals.error = req.flash("error");
  next();
});

//using router for users
app.use("/", userRoutes);
//using router for campgrounds
app.use("/campgrounds", campgroundRoutes);
//here in route, we have campgrounds id to pass but we can't directly use so we put mergeParam:true
app.use("/campgrounds/:id/reviews", reviewRoutes);

app.get("/", (req, res) => {
  res.render("home");
});

app.all("*", (req, res, next) => {
  next(new ExpressError("Page Not Found", 404));
});

//error handling middleware
app.use((err, req, res, next) => {
  const { statusCode = 500, message = "Something went wrong" } = err;
  if (!err.message) err.message = "Oh No, Something Went Wrong!";
  res.status(statusCode).render("error", { err });
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`Serving on port ${port}`);
});
