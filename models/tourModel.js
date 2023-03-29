const mongoose = require('mongoose');
const slugify = require('slugify');

const tourSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'A tour must have a name.'],
      unique: true,
      trim: true, // removes spaces at the begining and at the end of the string
      maxlength: [40, 'A tour name must have less or equal then 40 characters'],
      minlength: [10, 'A tour name must have more or equal then 10 characters'],
    },
    slug: String,
    rating: {
      type: Number,
      default: 4.5,
    },
    duration: {
      type: Number,
      required: [true, 'A tour must have a duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, ' A tour must have a group size'],
    },
    difficulty: {
      type: String,
      required: [true, 'A tour must have Difficulty'],
      // enum eshte vetem per stringjet
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: 'Difficulty is either: easy, medium, difficult',
      },
    },
    ratingsAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'Rating can not be lower than 1'],
      max: [5, 'Rating can not be higher than 5'],
      // Ex: (val = 4.667) => 4.7
      set: (val) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      type: Number,
      required: [true, 'A tour must have a price.'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this only points to current doc on NEW so is not going to work in PUT/PATCH
          return val < this.price;
        },
        // {VALUE} is equal with val parameter
        message:
          'Discount price ({VALUE}) con not be greater or equal with price',
      },
    },
    summary: {
      type: String,
      trim: true,
      required: [true, 'A tour must have a description'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'A tour must have a cover image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      // we can make a property not selectable or showable by putting select to false
      // select:false
    },
    startDates: [Date],
    secreetTour: {
      type: Boolean,
      default: false,
    },
    startLocation: {
      // GeoJSON
      type: {
        type: String,
        default: 'Point',
        enum: ['Point'],
      },
      coordinates: [Number],
      address: String,
      description: String,
    },
    locations: [
      {
        type: {
          type: String,
          default: 'Point',
          enum: ['Point'],
        },
        coordinates: [Number],
        address: String,
        description: String,
        day: Number,
      },
    ],
    // implementing user IDs by referencing
    guides: [{ type: mongoose.Schema.ObjectId, ref: 'User' }],
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// sort by price in ascending order "Ex for descending { price: -1 }"
// tourSchema.index({ price: 1 });
tourSchema.index({ price: 1, ratingsAverage: -1 });
tourSchema.index({ slug: 1 });
tourSchema.index({ startLocation: '2dsphere' });

tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

// Virtual populated
tourSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'tour',
  localField: '_id',
});

// mongoose MiddleWares

// 1. DOCUMENT MIDDLEWARE: runs before .save() and .create() only
// tourSchema.pre(' ', function (next) {
//   console.log('Mongoose Middleware', this);
//   this.slug = slugify(this.name, { lower: true });
//   next();
// });

// Query MiddleWare
tourSchema.pre(/^find/, function (next) {
  // in query middleware this points to the query
  this.populate({
    // field to populate by user data with ids in guide field
    path: 'guides',
    // fields we do not want to show
    select: '-__v -passwordChangedAt',
  });

  next();
});

// DOCUMENT MIDDLEWARE: runs before .save() and .create()
tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// 2. DOCUMENT MIDDLEWARE: runs after .save() and .create() only
// tourSchema.post('save', function (doc, next) {
//   console.log(doc);
//   next();
// });

// 3. QUERY MIDDLEWARE
// tourSchema.pre('find', function (next) {
// to make this middleware work for all methods that start with find we do by regex:
tourSchema.pre(/^find/, function (next) {
  // in this case we point in query and not in the doc
  // select only tours that are not secret
  this.find({ secreetTour: { $ne: true } });

  this.start = Date.now();
  next();
});

// tourSchema.post(/^find/, function (docs, next) {
//   console.log(`Query took ${Date.now() - this.start} milliseconds`);
//   // console.log(docs);
//   next();
// });

// AGGREGATION MIDDLEWARE => kudo qe ne perdorim agregimin si objekti "match" tek getToursStats perjashtojm secreet tours
// tourSchema.pre('aggregate', function (next) {
//   // shtojme queryn ne poz 0
//   this.pipeline().unshift({ $match: { secreetTour: { $ne: true } } });
//   console.log('AGGREGATION MIDDLEWARE', this.pipeline());
//   next();
// });

const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
