const express = require('express');
const router = express.Router({ mergeParams: true });
const catchAsync = require('../utils/catchAsync');
const ExpressError = require("../utils/ExpressError");
const Review = require('../models/review');
const Joi = require('joi');
const { reviewSchema } = require('../schemas.js');

const { validateReview, isLoggedIn, isReviewAuthor } = require('../middleware.js');
const reviews = require('../controllers/reviews');



router.post("/", validateReview, isLoggedIn, catchAsync(reviews.addReview))
router.delete("/:reviewId", isLoggedIn, isReviewAuthor, catchAsync(reviews.removeReview))

module.exports = router;