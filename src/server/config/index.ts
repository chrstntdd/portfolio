require('dotenv').load();

const ENV = process.env.NODE_ENV;
const JWT_SECRET = 'HwgwUXpKWT4DKnCcGgKbhCPSnCSjZ3cf';
let DATABASE_URL;
let PORT;

if (ENV === 'production') {
  DATABASE_URL = process.env.MONGODB_URI;
  PORT = parseInt(process.env.PORT, 10);
} else {
  DATABASE_URL = 'mongodb://chrstntdd:cranesinthesky0@ds261917.mlab.com:61917/personal-site';
  PORT = 3000;
}

export interface IServerConfigurations {
  env: string;
  port: number;
  dbUrl: string;
  jwtSecret: string;
  jwtExpiration: string;
}

export const getServerConfigs = (): IServerConfigurations => ({
  env: ENV,
  port: PORT,
  dbUrl: DATABASE_URL,
  jwtSecret: JWT_SECRET,
  jwtExpiration: '2h'
});
