const cors = require('cors');
// const bodyParser = require('body-parser');
const path = require('path');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const compression = require('compression');
const express = require('express');
const morgan = require('morgan');
const AppError = require('./utils/appError');

const globalErrorHandler = require('./controllers/errorController');

// 3) ROUTES
const tourRouter = require('./routes/tourRoutes');
const viewRouter = require('./routes/viewRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const { webHookCheckout } = require('./controllers/bookingController');

const app = express();

// config below is used for heroku deployment
app.enable('trust proxy');

app.set('view engine', 'pug');

app.set('views', path.join(__dirname, 'views'));

// 1) GLOBAL MIDDLEWARES
app.use('*', cors());

// to activate preflight if the call is secure from the browser
// app.options('*', cors());

// Serving static files
app.use(express.static(path.join(__dirname, 'public')));

// helmet node package is used to secure HTTP headers
const scriptSrcUrls = [
  'https://api.tiles.mapbox.com/',
  'https://api.mapbox.com/',
  'https://cdnjs.cloudflare.com/ajax/libs/axios/0.18.0/axios.min.js',
  'https://api.mapbox.com/',
  'https://js.stripe.com/v3/',
];
const styleSrcUrls = [
  'https://api.mapbox.com/',
  'https://api.tiles.mapbox.com/',
  'https://fonts.googleapis.com/',
];
const connectSrcUrls = [
  'https://api.mapbox.com/',
  'https://a.tiles.mapbox.com/',
  'https://b.tiles.mapbox.com/',
  'https://events.mapbox.com/',
];
const fontSrcUrls = ['fonts.googleapis.com', 'fonts.gstatic.com'];

app.use(
  helmet.contentSecurityPolicy({
    directives: {
      defaultSrc: ["'self'", 'https://js.stripe.com/v3/'],
      connectSrc: ["'self'", ...connectSrcUrls],
      scriptSrc: ["'self'", ...scriptSrcUrls],
      styleSrc: ["'self'", "'unsafe-inline'", ...styleSrcUrls],
      workerSrc: ["'self'", 'blob:'],
      objectSrc: [],
      imgSrc: ["'self'", 'blob:', 'data:'],
      fontSrc: ["'self'", ...fontSrcUrls],
    },
  })
);
// app.use(helmet());

// Development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Limit requests from same API
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

// Menyra Kursit // venose para app.use(express.json)
// app.post(
//   '/webhook',
//   bodyParser.raw({ type: 'application/json' }),
//   webHookCheckout
// );
// app.use('/webhook', express.raw({ type: '*/*' }));
app.use(
  express.json({
    verify: (req, res, buf) => {
      req.rawBody = buf;
    },
    limit: '10kb',
  })
);

// // Body parser, reading data from body into req.body
// app.use(express.json({ limit: '10kb' }));

// Ledio test
// app.use((req, res, next) =>
//   req.originalUrl === '/webhook'
//     ? next()
//     : express.json({ limit: '10kb' })(req, res, next)
// );

// fund menyra kursit

// menyra ne github
// app.use((req, res, next) => {
//   console.log('USE======>', req.originalUrl);
//   if (req.originalUrl === '/webhook') {
//     console.log('NEXTTTTTTTTTTTTTTTTTTTTTTTT');
//     next(); // Do nothing with the body because I need it in a raw state.
//   } else {
//     express.json({ limit: '10kb' })(req, res, next); // ONLY do express.json() if the received request is NOT a WebHook from Stripe.
//   }
// });

// Returns middleware that only parses urlencoded bodies and only looks at requests where the Content-Type header matches the type option
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
app.use(cookieParser());

// Data sanitization against NoSQL query injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

/// Prevent parameter pollution
app.use(
  hpp({
    whitelist: [
      'duration',
      'ratingsQuantity',
      'ratingsAverage',
      'maxGroupSize',
      'difficulty',
      'price',
    ],
  })
);

// compression() is used to compress text that will go to client
app.use(compression());

// Test middleware
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use('/', viewRouter);
app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);
app.post(
  '/webhook',
  // express.raw({ type: 'application/json' }),
  webHookCheckout
);

// handle routes that are not found => .all includes all HTTP methods like POST, PUT, PATCH, POST etc..
// if we do .all handler in top it will catch every request that is doing in the server
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server.`, 404));
});

// error handling middleware
app.use(globalErrorHandler);

module.exports = app;
