const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  SassPlugin,
  QuantumPlugin,
  PostCSSPlugin,
  WebIndexPlugin,
  CSSResourcePlugin
} = require('fuse-box');
const { src, task, exec, context, tsc } = require('fuse-box/sparky');
const { ElmPlugin } = require('fuse-box-elm-plugin');
const autoprefixer = require('autoprefixer');
const purify = require('purify-css');
const { unlinkSync } = require('fs');
const { join } = require('path');
const express = require('express');

const POSTCSS_PLUGINS = [
  require('postcss-flexibility'),
  autoprefixer({
    browsers: [
      'Chrome >= 52',
      'FireFox >= 44',
      'Safari >= 7',
      'Explorer 11',
      'last 4 Edge versions'
    ]
  })
];
const outDir = join(__dirname, '/dist');
const clientOut = join(outDir, '/public');

const template = join(__dirname, 'src/client/index.html');
const title = 'Christian Todd | Web Developer';
const all = './**/**.*';

context(
  class {
    getMainConfig() {
      const isProd = this.isProduction;

      return FuseBox.init({
        homeDir: 'src/client',
        output: `${clientOut}/$name.js`,
        log: true,
        hash: isProd,
        sourceMaps: !isProd,
        target: 'browser@es5',
        cache: true,
        tsConfig: 'src/client/tsconfig.json',
        plugins: [
          [
            SassPlugin(),
            PostCSSPlugin(POSTCSS_PLUGINS),
            CSSResourcePlugin({
              inline: true
            }),
            isProd
              ? CSSPlugin({
                  group: 'main.css',
                  outFile: `${clientOut}/main.css`,
                  inject: false
                })
              : CSSPlugin()
          ],
          isProd ? ElmPlugin() : ElmPlugin({ warn: true, debug: true }),
          SVGPlugin(),
          WebIndexPlugin({
            template,
            title,
            path: './',
            pre: { relType: 'load' },
            async: true
          }),
          isProd &&
            QuantumPlugin({
              ensureES5: true,
              removeExportsInterop: false,
              bakeApiIntoBundle: 'app',
              uglify: true,
              treeshake: true
            })
        ]
      });
    }
  }
);

task('prod-build', async context => {
  context.isProduction = true;
  const fuse = context.getMainConfig();
  fuse.bundle('app').instructions('!> index.js');

  await fuse.run();
});

task('dev-build', async context => {
  const fuse = context.getMainConfig();

  fuse.dev({ root: false }, server => {
    const app = server.httpServer.app;
    app.use(express.static(clientOut));
    app.get('*', (req, res) => {
      res.sendFile(join(clientOut, '/index.html'));
    });
  });

  fuse
    .bundle('app')
    .hmr({ reload: true })
    .watch()
    .instructions('> index.js');

  await fuse.run();
});

task(
  'server-build',
  async () =>
    await tsc('src/server', {
      target: 'esnext',
      outDir: 'dist/'
    })
);

task('copy-static', () => src(all, { base: './src/client/assets/' }).dest(`${clientOut}/assets`));

task('copy-keys', () =>
  src('./**/*.{pem,crt}', { base: './src/server/keys/' }).dest(join(outDir, '/keys'))
);

task('copy-schema', () =>
  src('./**/*.graphql', { base: './src/server/graphql' }).dest(join(outDir, '/graphql'))
);

task('copy-server-assets', ['&copy-keys', '&copy-schema']);

task('client-clean', () => src(`${clientOut}/*`).clean(clientOut));

task('server-clean', () => src(`${outDir}/*`).clean(outDir));

task('purify', () => {
  const content = ['src/client**/*.elm', 'src/client**/*.html'];
  const css = [`${clientOut}/main.css`];
  const options = {
    output: `${clientOut}/pure.css`,
    minify: true,
    info: true
  };
  purify(content, css, options);

  unlinkSync(`${clientOut}/main.css`);
  unlinkSync(`${clientOut}/main.css.map`);

  console.info('💎  ALL CSS IS PURE 💎');
});

task('default', ['clean', 'dev-build', 'copy-static'], () =>
  console.info('👊 Development server is live. GET TO WORK! 👊')
);
task('dist', ['client-clean', 'prod-build', 'copy-static', 'purify'], () =>
  console.info('READY 4 PROD')
);

task('server', ['server-clean', 'copy-server-assets', 'server-build'], () =>
  console.log('YER BUILDT')
);
