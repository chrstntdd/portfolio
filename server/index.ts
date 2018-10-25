import express, { Request } from 'express';
import mongoose from 'mongoose';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import bodyParser from 'body-parser';
import graphql from 'express-graphql';
import { importSchema } from 'graphql-import';
import { makeExecutableSchema } from 'graphql-tools';
import { join } from 'path';

import resolvers from './graphql/resolvers';

require('dotenv').config();

const app = express();

/* Set mongoose promise to native ES6 promise */
(<any>mongoose).Promise = Promise;
mongoose.set('useCreateIndex', true);

const ENV = process.env.NODE_ENV || 'development';
const IS_PRODUCTION = ENV === 'production';
let DATABASE_URL;
let PORT;

if (IS_PRODUCTION) {
  DATABASE_URL = process.env.MONGODB_URI;
  PORT = parseInt(process.env.PORT, 10);
} else {
  // Windows development will use the remote mLab DB to forgo spinning
  // up a mongodb server locally
  if (process.env.IS_WINDOWS) {
    DATABASE_URL = process.env.TEST_DATABASE_URL;
  } else {
    DATABASE_URL = process.env.LOCAL_DATABASE_URL;
  }
  PORT = 3000;
}

app.use(compression());
app.use(helmet());
app.use(morgan('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4444');
  res.header('Access-Control-Allow-Origin', 'http://localhost:8080');
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, Authorization, Access-Control-Allow-Credentials'
  );
  res.header('Access-Control-Allow-Credentials', 'true');
  next();
});

app.get('/ping', (_, res) => {
  res.status(200).send('pong');
});

const typeDefs = importSchema(join(__dirname, 'graphql/schema.graphql'));
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
  resolverValidationOptions: {
    requireResolversForResolveType: false
  }
});

mongoose.connect(
  DATABASE_URL,
  { useNewUrlParser: true }
);

// CONNECTION EVENTS
// When successfully connected
mongoose.connection.on('connected', function() {
  console.log('Mongoose default connection open to ' + DATABASE_URL);
});

// If the connection throws an error
mongoose.connection.on('error', function(err) {
  console.log('Mongoose default connection error: ' + err);
});

// When the connection is disconnected
mongoose.connection.on('disconnected', function() {
  console.log('Mongoose default connection disconnected');
});

// If the Node process ends, close the Mongoose connection
process.on('SIGINT', function() {
  mongoose.connection.close(function() {
    console.log('Mongoose default connection disconnected through app termination');
    process.exit(0);
  });
});

export interface GraphQlContext {
  request: Request;
  mongodb: typeof mongoose;
}

app.use(
  '/graphql',
  graphql((request: Request, response, graphQlParams) => {
    return {
      schema,
      pretty: !IS_PRODUCTION,
      graphiql: !IS_PRODUCTION,
      context: {
        request
      },
      formatError: ({ extensions = {}, message, locations, stack = '', path }) => ({
        message,
        ...(!IS_PRODUCTION && {
          locations,
          stack: stack.split('\n'),
          path,
          ...extensions
        })
      })
    };
  })
);

let server;

const runServer = async (port: number = PORT) => {
  try {
    await new Promise((resolve, reject) => {
      server = app
        .listen(port, () => {
          console.info(`The ${ENV} server is listening on port ${port} 🤔`);
          resolve();
        })
        .on('error', err => {
          mongoose.disconnect();
          reject(err);
        });
    });
  } catch (err) {
    console.error(err);
  }
};

const closeServer = async () => {
  try {
    await mongoose.disconnect();
    await new Promise((resolve, reject) => {
      console.info(`Closing server. Goodbye old friend.`);
      server.close(err => (err ? reject(err) : resolve()));
    });
  } catch (err) {
    console.error(err);
  }
};

require.main === module && runServer().catch(err => console.error(err));

export { runServer, closeServer, app };
