import * as Hapi from 'hapi';
import * as Boom from 'boom';
import * as Inert from 'inert';
import * as Good from 'good';
import * as h2 from 'http2';
import { makeExecutableSchema } from 'graphql-tools';
import { graphqlHapi, graphiqlHapi } from 'apollo-server-hapi';
import { importSchema } from 'graphql-import';
import { print } from 'graphql/language/printer';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IServerConfigurations } from './config';

import resolvers from './graphql/resolvers';

export async function init(configs: IServerConfigurations): Promise<Hapi.Server> {
  const typeDefs = importSchema(join(__dirname, '/graphql/schema.graphql'));

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  let listener = h2.createSecureServer({
    key: readFileSync(join(__dirname, '/keys/key.pem'), 'UTF-8'),
    cert: readFileSync(join(__dirname, '/keys/server.crt'), 'UTF-8')
  });

  const port = configs.port;
  const server = new Hapi.Server({
    port,
    listener,
    tls: true,
    routes: {
      files: {
        relativeTo: join(__dirname, 'public')
      }
    }
  });

  await server.register([
    {
      plugin: graphqlHapi,
      options: {
        path: '/graphql',
        graphqlOptions: () => ({ pretty: true, schema }),
        route: {
          cors: true
        }
      }
    },
    {
      plugin: graphiqlHapi,
      options: {
        path: '/graphiql',
        graphiqlOptions: {
          endpointURL: '/graphql'
        }
      }
    },
    Inert,
    {
      plugin: Good,
      options: {
        ops: {
          interval: 1000
        },
        reporters: {
          myConsoleReporter: [
            {
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ log: '*', response: '*' }]
            },
            {
              module: 'good-console'
            },
            'stdout'
          ],
          myFileReporter: [
            {
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ ops: '*' }]
            },
            {
              module: 'good-squeeze',
              name: 'SafeJson'
            }
          ],
          myHTTPReporter: [
            {
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ error: '*' }]
            }
          ]
        }
      }
    }
  ]);

  /* FOR SERVING INDEX.HTML AND FRONT END ASSETS FOR ALL REQUESTS. */
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        index: true,
        redirectToSlash: true
      }
    }
  });

  /*  
   *  ¯\_(ツ)_/¯
   *  I GUESS BACKUP DEFINED ROUTES BECAUSE THE ABOVE SOLUTION WONT WORK  
   *  MIGHT AS WELL GET A STATIC SITE GENERATOR UP IN THIS BITCH
   *  ¯\_(ツ)_/¯ 
   */
  server.route({
    method: 'GET',
    path: '/about',
    handler: {
      file: 'index.html'
    }
  });

  server.route({
    method: 'GET',
    path: '/projects/{param*}',
    handler: {
      file: 'index.html'
    }
  });

  server.route({
    method: 'GET',
    path: '/contact',
    handler: {
      file: 'index.html'
    }
  });

  return server;
}
