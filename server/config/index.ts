require('dotenv').load();

let DATABASE_URL;
let PORT;

const ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || 'QlFBkeSJMWJgzJYvjKYY';

/* set environment variables */
if (ENV === 'production') {
  DATABASE_URL = process.env.MONGODB_URI;
  PORT = parseInt(process.env.PORT, 10);
} else {
  DATABASE_URL = process.env.TEST_DATABASE_URL;
  PORT = 3000;
}

export { DATABASE_URL, PORT, ENV, JWT_SECRET };
