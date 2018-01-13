import * as Hapi from 'hapi';
import * as Boom from 'boom';
import { join } from 'path';
import { readFileSync } from 'fs';
import * as h2 from 'http2';


let listener = h2.createSecureServer({
  key: readFileSync(join(__dirname, '/key.pem'), 'UTF-8'),
  cert: readFileSync(join(__dirname, '/server.crt'), 'UTF-8')
})

const server = new Hapi.Server({
  tls: true,
  listener: listener,
  port: '8000',
});


server.route({
  method: 'GET',
  path: '/',
  handler: (request, h) => {
    return h.response("Hello, Hapi 17");
  }
});


const start = async () => {
  try {
    await server.start();
  } catch (error) {
    console.log(error);
    process.exit(1);
  }

  console.log('Server running at:', server.info.uri);
}

start();