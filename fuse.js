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

const OUT_DIR = join(__dirname, 'dist');
const CLIENT_OUT = join(OUT_DIR, 'public');

const TEMPLATE = join(__dirname, 'src/client/index.html');
const TITLE = 'Christian Todd | Web Developer';
const ALL_FILES = './**/**.*';

context(
  class {
    compileClient() {
      return FuseBox.init({
        homeDir: 'src/client',
        output: `${CLIENT_OUT}/$name.js`,
        log: true,
        sourceMaps: !this.isProduction,
        target: 'browser@es5',
        cache: !this.isProduction,
        tsConfig: 'src/client/tsconfig.json',
        plugins: [
          [SassPlugin(), PostCSSPlugin(POSTCSS_PLUGINS), CSSPlugin()],
          this.isProduction ? ElmPlugin() : ElmPlugin({ warn: true, debug: true }),
          SVGPlugin(),
          WebIndexPlugin({
            template: TEMPLATE,
            title: TITLE,
            path: '/',
            pre: { relType: 'load' },
            async: true
          }),
          this.isProduction &&
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
      await tsc('src/server', {
        target: 'esnext',
        OUT_DIR: 'dist/',
        listEmittedFiles: true,
        watch: !this.isProduction,
        sourceMap: !this.isProduction
      });
    }
  }
);

/* INDIVIDUAL BUILD TASKS USED IN VARIOUS BUILD TASK CHAINS */

task('client-prod-build', async context => {
  context.isProduction = true;

  const fuse = context.compileClient();
  fuse.bundle('app').instructions('!> index.ts');

  await fuse.run();
});

task('client-dev-build', async context => {
  const fuse = context.compileClient();

  fuse.dev({ root: false }, server => {
    const app = server.httpServer.app;
    app.use(express.static(CLIENT_OUT));
    app.get('*', (req, res) => {
      res.sendFile(join(CLIENT_OUT, 'index.html'));
    });
  });

  fuse
    .bundle('app')
    .hmr({ reload: true })
    .watch()
    .instructions('> index.ts');

  await fuse.run();
});

task('server-build', async context => await context.compileServer());

/* TASKS TO COPY FILES */
task('copy-static', () =>
  src(ALL_FILES, { base: './src/client/assets/' }).dest(`${CLIENT_OUT}/assets`)
);

task('copy-keys', () => src(ALL_FILES, { base: './src/server/keys/' }).dest(join(OUT_DIR, 'keys')));

task('copy-schema', () =>
  src('./**/*.graphql', { base: './src/server/graphql' }).dest(join(OUT_DIR, 'graphql'))
);

task('mv-sw', () =>
  src('workbox-sw.prod.v2.1.2.js', {
    base: './node_modules/workbox-sw/build/importScripts/'
  }).dest(`${CLIENT_OUT}`)
);

/* TASKS TO CLEAN OUT OLD FILES BEFORE COMPILATION */
task('client-clean', () => src(`${CLIENT_OUT}/*`).clean(CLIENT_OUT));

task('server-clean', () => src(`${OUT_DIR}/*`).clean(OUT_DIR));

/* PARALLEL TASKS */
task('f:dev', ['&client-dev-build', '&copy-static']);
task('f:prod', ['&client-prod-build', '&copy-static']); // add mv-sw when using service worker
task('b:copy', ['&copy-keys', '&copy-schema']);
task('all:prod', ['&front-prod', '&back-prod']);

/* CUSTOM BUILD TASKS */
task('purify', () => {
  const content = ['src/client/**/*.elm', 'src/client/**/*.html'];
  const css = [`${CLIENT_OUT}/styles.css`];
  const options = {
    output: `${CLIENT_OUT}/pure.css`,
    minify: true,
    info: true
  };
  purify(content, css, options);

  unlinkSync(`${CLIENT_OUT}/styles.css`);

  info('💎  ALL CSS IS PURE 💎');
});

task('gen-sw', async () => {
  try {
    await workbox.injectManifest({
      globDirectory: `${CLIENT_OUT}`,
      staticFileGlobs: ['**/*.{html,js,css,svg,jpg}'],
      globIgnores: ['**/sw.js'],
      swSrc: 'src/client/sw.js',
      swDest: `${CLIENT_OUT}/sw.js`
    });
    info('  ⚙️ Service worker generated 🛠');
  } catch (error) {
    info('  😒 There was an error generating the service worker 😒', error);
  }
});

task('fancy-fallbacks', async () => {
  const pathsToCSS = await asyncGlob(`${CLIENT_OUT}/**/*.css`);

  pathsToCSS.map(async cssFile => {
    const fileContent = await fs.readFile(cssFile, 'UTF-8');
    const result = await postcss([resembleImage({ selectors: ['header #hero-img'] })]).process(
      fileContent,
      { from: `${CLIENT_OUT}/styles.css`, to: `${CLIENT_OUT}/styles.css` }
    );
    fs.writeFile(`${CLIENT_OUT}/styles.css`, result.css);
  });
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
  info('The back end code has been compiled and is ready for production.');
});

task('all', async () => {
  fs.removeSync(join(__dirname, '.fusebox'));
  await exec('all:prod');
  info("THAT'S ALL FOLX");
});
