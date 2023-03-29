/* eslint-disable */

const mongoose = require('mongoose');
const dotenv = require('dotenv');

const main = async () => {
  // this handler MUST stay at top
  process.on('uncaughtException', (err) => {
    console.log('UNHALDED EXCEPTION! 💥 Server is shuting down...');
    console.log(err.name, err.message);
    console.log(err);
    // shut down application
    process.exit(1);
  });

  dotenv.config({ path: './config.env' });
  const app = require('./app');

  const port = process.env.PORT || 1111;

  const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );

  const dbConn = await mongoose.connect(DB, {
    useUnifiedTopology: true,
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
  });

  if (dbConn) console.log('Database is connected...');
  const server = app.listen(port, () => {
    console.log(`App running on port ${port} ....`);
  });

  process.on('unhandledRejection', (err) => {
    console.log(err.name, err.message);
    console.log('UNHALDED REJECTION! 💥 Server is shuting down...');
    server.close(() => {
      // shut down application
      process.exit(1);
    });
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM RECIVED. Shutting down gracefully');
    server.close(() => {
      console.log('Process terminated!');
    });
  });
};
main();
