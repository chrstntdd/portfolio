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
    tls: true
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

  /* define route for sending static front end assets */
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: join(__dirname, '/public'),
        redirectToSlash: true,
        index: true
      }
    }
  });

  return server;
}
