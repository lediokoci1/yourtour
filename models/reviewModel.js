const mongoose = require('mongoose');

const Tour = require('./tourModel');

const reviewSchema = new mongoose.Schema(
  {
    review: {
      type: String,
    },
    rating: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
    },
    createdAt: {
      type: Date,
      default: Date.now(),
    },
    tour: {
      type: mongoose.Schema.ObjectId,
      ref: 'Tour',
      required: [true, 'Review must belong to a tour.'],
    },
    user: {
      type: mongoose.Schema.ObjectId,
      ref: 'User',
      required: [true, 'Review must belong to a user.'],
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

reviewSchema.index({ tour: 1, user: 1 }, { unique: true });

// Query MiddleWare
reviewSchema.pre(/^find/, function (next) {
  // in query middleware this points to the query
  this.populate({
    path: 'user',
    select: 'name photo',
  });

  next();
});

reviewSchema.statics.calcAverageRatings = async function (tourId) {
  // stats have number of reviews for that tourId and average of ratings
  const stats = await this.aggregate([
    {
      $match: { tour: tourId },
    },
    {
      $group: {
        _id: '$tour',
        nRating: { $sum: 1 },
        avgRating: { $avg: '$rating' },
      },
    },
  ]);

  let ratingsQuantity = stats[0].nRating;
  let ratingsAverage = stats[0].avgRating;
  if (!stats.length) {
    ratingsQuantity = 0;
    ratingsAverage = 4.5;
  }

  // update tour review by stats value
  await Tour.findByIdAndUpdate(tourId, {
    ratingsQuantity,
    ratingsAverage,
  });
};

reviewSchema.post('save', function () {
  // this.constructor points to reviewSchema "NOTE we use { this.constructor } instead of this because this is pointing in reviewSchema but
  // { .post } middleware is called after Review model is defined"
  this.constructor.calcAverageRatings(this.tour);
});

// to avoid using middleware above with { this.constructor ...}
// we get data that are not updated yet and pass to next middleware
reviewSchema.pre(/^findOneAnd/, async function (next) {
  this.r = await this.findOne();
  next();
});

reviewSchema.post('/^findOneAnd', async function () {
  await this.r.constructor.calcAverageRatings(this.r.tour);
  // calling next() function is not needed because this is last midddleware being called
});

const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;
