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
const { info } = console;

const POSTCSS_PLUGINS = [
  require('postcss-flexbugs-fixes'),
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
    compileClient() {
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

    async compileServer() {
      const isProd = this.isProduction;

      await tsc('src/server', {
        target: 'esnext',
        outDir: 'dist/',
        listEmittedFiles: true,
        watch: !isProd,
        sourceMap: !isProd
      });
    }
  }
);

/* INDIVIDIAL BUILD TASKS USED IN VARIOUS BUILD TASK CHAINS */
task('client-prod-build', async context => {
  context.isProduction = true;

  const fuse = context.compileClient();
  fuse.bundle('app').instructions('!> index.js');

  await fuse.run();
});

task('client-dev-build', async context => {
  const fuse = context.compileClient();

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

task('server-build', async context => await context.compileServer());

/* TASKS TO COPY FILES */
task('copy-static', () =>
  src(all, { base: './src/client/assets/' }).dest(`${clientOut}/assets`)
);

task('copy-keys', () =>
  src(all, { base: './src/server/keys/' }).dest(join(outDir, '/keys'))
);

task('copy-schema', () =>
  src('./**/*.graphql', { base: './src/server/graphql' }).dest(
    join(outDir, '/graphql')
  )
);

/* TASKS TO CLEAN OUT OLD FILES BEFORE COMPILATION */
task('client-clean', () => src(`${clientOut}/*`).clean(clientOut));

task('server-clean', () => src(`${outDir}/*`).clean(outDir));

/* PARALLEL TASKS */
task('f:dev', ['&client-dev-build', '&copy-static']);
task('f:prod', ['&client-prod-build', '&copy-static']);
task('b:copy', ['&copy-keys', '&copy-schema']);

/* CUSTOM BUILD TASKS */
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

  info('💎  ALL CSS IS PURE 💎');
});

/* MAIN BUILD TASK CHAINS */
task('front-dev', ['client-clean', 'f:dev'], () =>
  info('The front end assets have been bundled. GET TO WORK!')
);

task('front-prod', ['client-clean', 'f:prod', 'purify'], () =>
  info('The front end assets are optimized, bundled, and ready for production.')
);

task('back-dev', ['server-clean', 'b:copy', 'server-build'], () => {
  info('The back end code has been compiled. GET TO WORK!');
});

task('back-prod', async context => {
  context.isProduction = true;
  await exec('server-clean', 'b:copy', 'server-build');
  info('The back end code has been compiled for production. GET TO WORK!');
});

task('all', ['&front-prod', '&back-prod'], () => info("THAT'S ALL FOLX"));

/* DEFINE BUILD TASKS FOR EACH CASE
f:dev = front-end development

 * 1. build client assets, use dev server.
 *  -> clean clientOut
 *  -> bundle
 *  -> copy static assets

 * 2. build client assets for prod
 *  -> clean clientOut
 *  -> prod bundle
 *  -> copy static assets
 *  -> run purify 

 * 3. build server assets
 *  -> clean dist
 *  -> run tsc for server
 *  -> copy server assets

 * 4. watch server assets
 *  -> clean dist
 *  -> run tsc in watch mode for server
 *  -> copy server assets
 */
