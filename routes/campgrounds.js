const express = require("express");
const router = express.Router();
const campgrounds = require("../controllers/campgrounds");
const catchAsync = require("../utils/catchAsync");
const { isLoggedIn, validateCampground, isAuthor } = require("../middleware");
const multer = require("multer");
//initially it store in upload dir
// const upload = multer({ dest: "uploads/" });
const { storage } = require("../cloudinary");
const upload = multer({ storage });

const Campground = require("../models/campground");

//we define middleware for server-side validation with joi

// router.get("/", catchAsync(campgrounds.index));
//we catch error and pass to next so that middleware handle it
// router.post(
//   "/",
//   isLoggedIn,
//   validateCampground,
//   catchAsync(campgrounds.createCampground)
// );
//*****************above is older way
//using router.route

router
  .route("/")
  .get(catchAsync(campgrounds.index))
  .post(
    isLoggedIn,
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.createCampground)
  );

router.get("/new", isLoggedIn, campgrounds.renderNewForm);

router
  .route("/:id")
  .get(catchAsync(campgrounds.showCampground))
  .put(
    isLoggedIn,
    isAuthor,
    upload.array("image"),
    validateCampground,
    catchAsync(campgrounds.updateCampground)
  )
  .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));

router.get(
  "/:id/edit",
  isLoggedIn,
  isAuthor,
  catchAsync(campgrounds.renderEditForm)
);

module.exports = router;
