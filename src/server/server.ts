import * as Hapi from 'hapi';
import * as Boom from 'boom';
import * as Inert from 'inert';
import * as Good from 'good';
import * as Underdog from 'underdog';
import * as h2 from 'http2';
import { makeExecutableSchema } from 'graphql-tools';
import { graphqlHapi, graphiqlHapi } from 'apollo-server-hapi';
import { importSchema } from 'graphql-import';
import { readFileSync } from 'fs';
import { join } from 'path';
import { IServerConfigurations } from './config';

import resolvers from './graphql/resolvers';

export async function init(configs: IServerConfigurations): Promise<Hapi.Server> {
  const typeDefs = importSchema(join(__dirname, 'graphql/schema.graphql'));

  const schema = makeExecutableSchema({ typeDefs, resolvers });

  const listener = h2.createSecureServer({
    key: readFileSync(join(__dirname, 'keys/key.pem'), 'UTF-8'),
    cert: readFileSync(join(__dirname, 'keys/server.crt'), 'UTF-8')
  });

  const port = configs.port;
  const server = new Hapi.Server({
    port,
    listener,
    tls: true,
    routes: {
      files: { relativeTo: join(__dirname, 'public') }
    }
  });

  await server.register([
    {
      plugin: graphqlHapi,
      options: {
        path: '/graphql',
        graphqlOptions: () => ({ pretty: true, schema }),
        route: { cors: true }
      }
    },
    {
      plugin: graphiqlHapi,
      options: {
        path: '/graphiql',
        graphiqlOptions: { endpointURL: '/graphql' }
      }
    },
    Inert,
    {
      plugin: Good,
      options: {
        ops: { interval: 1000 },
        reporters: {
          myConsoleReporter: [
            {
              module: 'good-squeeze',
              name: 'Squeeze',
              args: [{ log: '*', response: '*' }]
            },
            { module: 'good-console' },
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
    },
    Underdog
  ]);

  /* FOR SERVING INDEX.HTML AND FRONT END ASSETS FOR ALL REQUESTS. */
  server.route({
    method: 'GET',
    path: '/{param*}',
    handler: {
      directory: {
        path: '.',
        index: true,
        redirectToSlash: true,
        lookupCompressed: true
      }
    }
  });

  const index = readFileSync(join(__dirname, 'public/index.html')).toString();

  server.route({
    method: 'GET',
    path: '/',
    handler: (request, h) => {
      const response = h.response(index);
      h.push(response, ['/app.js', '/styles.css', '/assets/hero-bg.jpg'], {
        'accept-encoding': 'gzip'
      });

      return response;
    }
  });

  server.route({
    method: 'GET',
    path: '/about',
    handler: (request, h) => {
      const response = h.response(index);
      h.push(response, ['/app.js', '/styles.css', '/assets/portrait.jpg'], {
        'accept-encoding': 'gzip'
      });

      return response;
    }
  });

  server.route({
    method: 'GET',
    path: '/projects/{param*}',
    handler: (request, h) => {
      const response = h.response(index);
      h.push(
        response,
        ['/app.js', '/styles.css', '/assets/icons/chevron.svg', '/assets/gif/idea.gif'],
        { 'accept-encoding': 'gzip' }
      );

      return response;
    }
  });

  server.route({
    method: 'GET',
    path: '/contact',
    handler: (request, h) => {
      const response = h.response(index);
      h.push(
        response,
        [
          '/app.js',
          '/styles.css',
          '/assets/icons/github.svg',
          '/assets/icons/linkedin.svg',
          '/assets/icons/twitter.svg'
        ],
        { 'accept-encoding': 'gzip' }
      );

      return response;
    }
  });

  return server;
}
