import * as Mongoose from 'mongoose';

const connectionOptions = {
  keepAlive: true,
  reconnectTries: Number.MAX_VALUE
};

export const init = (databaseUrl: string): void => {
  (<any>Mongoose).Promise = Promise;

  Mongoose.connect(databaseUrl, connectionOptions);

  const mongo = Mongoose.connection;

  mongo.on('error', () => console.log(`🤕 Unable to connect to the database. 🤕`));

  mongo.once('open', () => console.log(`💾  Connected to database! 💾`));
};
