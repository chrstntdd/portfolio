const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  SassPlugin,
  QuantumPlugin,
  PostCSSPlugin,
  WebIndexPlugin
} = require('fuse-box');
const { src, task, exec, context, tsc } = require('fuse-box/sparky');
const { ElmPlugin } = require('fuse-box-elm-plugin');
const autoprefixer = require('autoprefixer');
const purify = require('purify-css');
const { unlinkSync } = require('fs');
const { join } = require('path');
const express = require('express');
const workbox = require('workbox-build');
const { info } = console;
const { promisify } = require('util');
const fs = require('fs-extra');
const resembleImage = require('postcss-resemble-image').default;
const postcss = require('postcss');
const glob = require('glob');
const asyncGlob = promisify(glob);

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

const outDir = join(__dirname, 'dist');
const clientOut = join(outDir, 'public');

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
        sourceMaps: !isProd,
        target: 'browser@es5',
        cache: !isProd,
        tsConfig: 'src/client/tsconfig.json',
        plugins: [
          [SassPlugin(), PostCSSPlugin(POSTCSS_PLUGINS), CSSPlugin()],
          isProd ? ElmPlugin() : ElmPlugin({ warn: true, debug: true }),
          SVGPlugin(),
          WebIndexPlugin({
            template,
            title,
            path: '/',
            pre: { relType: 'load' },
            async: true
          }),
          isProd &&
            QuantumPlugin({
              bakeApiIntoBundle: 'app',
              uglify: true,
              treeshake: true,
              css: true
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

/* INDIVIDUAL BUILD TASKS USED IN VARIOUS BUILD TASK CHAINS */

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
task('copy-static', () => src(all, { base: './src/client/assets/' }).dest(`${clientOut}/assets`));

task('copy-keys', () => src(all, { base: './src/server/keys/' }).dest(join(outDir, '/keys')));

task('copy-schema', () =>
  src('./**/*.graphql', { base: './src/server/graphql' }).dest(join(outDir, '/graphql'))
);

task('mv-sw', () =>
  src('workbox-sw.prod.v2.1.2.js', {
    base: './node_modules/workbox-sw/build/importScripts/'
  }).dest(`${clientOut}`)
);

/* TASKS TO CLEAN OUT OLD FILES BEFORE COMPILATION */
task('client-clean', () => src(`${clientOut}/*`).clean(clientOut));

task('server-clean', () => src(`${outDir}/*`).clean(outDir));

/* PARALLEL TASKS */
task('f:dev', ['&client-dev-build', '&copy-static']);
task('f:prod', ['&client-prod-build', '&copy-static']); // add mv-sw when using service worker
task('b:copy', ['&copy-keys', '&copy-schema']);
task('all:prod', ['&front-prod', '&back-prod']);

/* CUSTOM BUILD TASKS */
task('purify', () => {
  const content = ['src/client**/*.elm', 'src/client**/*.html'];
  const css = [`${clientOut}/styles.css`];
  const options = {
    output: `${clientOut}/pure.css`,
    minify: true,
    info: true
  };
  purify(content, css, options);

  unlinkSync(`${clientOut}/styles.css`);

  info('💎  ALL CSS IS PURE 💎');
});

task('gen-sw', async () => {
  try {
    await workbox.injectManifest({
      globDirectory: `${clientOut}`,
      staticFileGlobs: ['**/*.{html,js,css,svg,jpg}'],
      globIgnores: ['**/sw.js'],
      swSrc: 'src/client/sw.js',
      swDest: `${clientOut}/sw.js`
    });
    info('  ⚙️ Service worker generated 🛠');
  } catch (error) {
    info('  😒 There was an error generating the service worker 😒', error);
  }
});

task('fancy-fallbacks', async () => {
  const pathsToCSS = await asyncGlob(`${clientOut}/**/*.css`);

  pathsToCSS.map(async cssFile => {
    const fileContent = await fs.readFile(cssFile, 'UTF-8');
    const result = await postcss([resembleImage({ selectors: ['header #hero-img'] })]).process(
      fileContent,
      { from: `${clientOut}/styles.css`, to: `${clientOut}/styles.css` }
    );
    fs.writeFile(`${clientOut}/styles.css`, result.css);
  });
});

/* MAIN BUILD TASK CHAINS */
task('front-dev', ['client-clean', 'f:dev'], () =>
  info('The front end assets have been bundled. GET TO WORK!')
);

task('front-prod', ['client-clean', 'f:prod'], () =>
  info('The front end assets are optimized, bundled, and ready for production.')
);

task('back-dev', ['server-clean', 'b:copy', 'server-build'], () => {
  info('The back end code has been compiled. GET TO WORK!');
});

task('back-prod', async context => {
  context.isProduction = true;
  await exec('server-clean', 'b:copy', 'server-build');
  info('The back end code has been compiled and is ready for production.');
});

task('all', async () => {
  fs.removeSync(join(__dirname, '/.fusebox/'));
  await exec('all:prod');
  info("THAT'S ALL FOLX");
});
