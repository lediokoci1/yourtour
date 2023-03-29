const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const config = require('../../config');

dotenv.config({ path: '../../cconfig.env' });

const Tour = require('../../models/tourModel');
const Review = require('../../models/reviewModel');
const User = require('../../models/userModel');

const main = async () => {
  const connection = await mongoose.connect(config.getDbConnectionString(), {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
  const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
  const reviews = JSON.parse(
    fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8')
  );

  const importData = async () => {
    try {
      await Tour.create(tours);
      await User.create(users, { validateBeforeSave: false });
      await Review.create(reviews);
    } catch (error) {
      console.log(error);
    }
    process.exit();
  };

  const deleteData = async () => {
    try {
      await Tour.deleteMany();
      await User.deleteMany();
      await Review.deleteMany();
    } catch (error) {
      console.log(error);
    }
    process.exit();
  };

  switch (process.argv[2]) {
    case '--import':
      importData();
      break;
    case '--delete':
      deleteData();
      break;
    default:
      break;
  }
  return connection;
};

main()
  .then(() => console.log('DB Status: CONNECTED'))
  .catch((err) => {
    console.log('DB Status: DISCONNECTED');
    console.error(err);
    process.exit(1);
  });
