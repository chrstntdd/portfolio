const {
  FuseBox,
  CSSPlugin,
  SassPlugin,
  QuantumPlugin,
  PostCSSPlugin,
  WebIndexPlugin
} = require('fuse-box');
const { src, task, context } = require('fuse-box/sparky');
const { ElmPlugin } = require('fuse-box-elm-plugin');
const autoprefixer = require('autoprefixer');
const { join } = require('path');
const express = require('express');
const workbox = require('workbox-build');
const { info } = console;
const { unlinkSync, writeFileSync } = require('fs');
const tailwindcss = require('tailwindcss');
const Purgecss = require('purgecss');

const POSTCSS_PLUGINS = [
  require('postcss-flexbugs-fixes'),
  tailwindcss(join(__dirname, '/node_modules/tailwindcss/defaultConfig.js')),
  autoprefixer({
    browsers: ['>0.25%', 'Explorer 11'],
    grid: true
  })
];

const OUT_DIR = join(__dirname, 'dist');
const TEMPLATE = join(__dirname, 'src/index.html');
const TITLE = 'Christian Todd | Web Developer';
const ALL = './**/**.*';

context(
  class {
    compileClient() {
      return FuseBox.init({
        homeDir: 'src',
        output: `${OUT_DIR}/$name.js`,
        log: false,
        sourceMaps: !this.isProduction,
        target: 'browser@es5',
        cache: !this.isProduction,
        allowSyntheticDefaultImports: true,
        alias: {
          '@': '~'
        },
        plugins: [
          [SassPlugin({ importer: true }), PostCSSPlugin(POSTCSS_PLUGINS), CSSPlugin()],
          this.isProduction ? ElmPlugin() : ElmPlugin({ warn: true, debug: true }),
          WebIndexPlugin({
            template: TEMPLATE,
            title: TITLE
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
    app.use(express.static(`${OUT_DIR}/css-sourcemaps/`));
    app.use(express.static(`${OUT_DIR}/sw.js`));
    app.use(express.static(`${OUT_DIR}/assets`));
    app.use(express.static(`${OUT_DIR}/assets/favicons`));
    app.use(express.static(OUT_DIR));
    app.get('*', (req, res) => {
      res.sendFile(join(OUT_DIR, 'index.html'));
    });
  });

  fuse
    .bundle('app')
    .hmr({ reload: true })
    .watch()
    .instructions('> index.ts');

  await fuse.run();
});

/* TASKS TO COPY FILES */
task('copy-static', () => src(ALL, { base: './src/assets/' }).dest(`${OUT_DIR}/assets`));

/* TASKS TO CLEAN OUT OLD FILES BEFORE COMPILATION */
task('client-clean', () => src(`${OUT_DIR}/*`).clean(OUT_DIR));

/* PARALLEL TASKS */
task('f:dev', ['&client-dev-build', '&copy-static']);
task('f:prod', ['&client-prod-build', '&copy-static']); // add mv-sw when using service worker

/* CUSTOM BUILD TASKS */
task('purge', () => {
  class TailwindExtractor {
    static extract(content) {
      return content.match(/[A-z0-9-:\/]+/g);
    }
  }

  const purged = new Purgecss({
    content: ['src/**/*.elm', 'src/**/*.html'],
    css: [`${OUT_DIR}/styles.css`],
    extractors: [
      {
        extractor: TailwindExtractor,
        extensions: ['html', 'elm']
      }
    ],
    whitelist: ['project-card__vinyldb', 'project-card__quantified', 'project-card__roaster-nexus']
  });

  const [result] = purged.purge();

  unlinkSync(`${OUT_DIR}/styles.css`);

  writeFileSync(result.file, result.css, 'UTF-8');

  info('💎  THE CSS HAS BEEN PURGED 💎');
});

task('gen-sw', async () => {
  try {
    const stats = await workbox.injectManifest({
      globDirectory: 'dist',
      globPatterns: ['**/*.{html,js,css,png,svg,jpg,jpeg,gif}'],
      globIgnores: ['**/sw.js'],
      swSrc: './src/sw.js',
      swDest: './dist/sw.js'
    });

    info(
      ` ⚙️ Service worker generated 🛠 \n ${
        stats.count
      } files will be precached, totaling ${stats.size / 1000000.0} MB.`
    );
  } catch (error) {
    info('  😒 There was an error generating the service worker 😒', error);
  }
});

/* MAIN BUILD TASK CHAINS */
task('front-dev', ['client-clean', 'f:dev', 'gen-sw'], () =>
  info('The front end assets have been bundled. GET TO WORK!')
);

task('front-prod', ['client-clean', 'f:prod', 'purge', 'gen-sw'], () =>
  info('The front end assets are optimized, bundled, and ready for production.')
);
