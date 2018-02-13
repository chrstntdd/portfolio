import * as Server from './server';
import * as Database from './database';
import * as Configs from './config';

process.on('uncaughtException', ({ message }) => console.error(`uncaughtException ${message}`));

process.on('unhandledRejection', reason => console.error(`unhandledRejection ${reason}`));

const serverConfig = Configs.getServerConfigs();

console.log(`🌿  Running in a ${serverConfig.env} environment🌿`);

/* INITIALIZE THE DATABASE */
const database = Database.init(serverConfig.dbUrl);

/* INITIALIZE THE APPLICATION SERVER */
(async () => {
  const server = await Server.init(serverConfig);
  await server.start();

  console.log(`✨  Server running at: https://localhost:${serverConfig.port}  ✨`);
})();
