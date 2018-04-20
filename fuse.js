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
const { join, basename, dirname } = require('path');
const express = require('express');
const workbox = require('workbox-build');
const { info } = console;
const { promisify } = require('util');
const { unlinkSync, renameSync, readFileSync, writeFileSync } = require('fs');
const { gzipSync } = require('zlib');
const tailwindcss = require('tailwindcss');
const Purgecss = require('purgecss');
const fs = require('fs-extra');
const resembleImage = require('postcss-resemble-image').default;
const postcss = require('postcss');
const glob = require('glob');
const asyncGlob = promisify(glob);

const POSTCSS_PLUGINS = [
  require('postcss-flexbugs-fixes'),
  tailwindcss(join(__dirname, '/node_modules/tailwindcss/defaultConfig.js')),
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
const ALL = './**/**.*';

context(
  class {
    compileClient() {
      return FuseBox.init({
        homeDir: 'src/client',
        output: `${CLIENT_OUT}/$name.js`,
        log: false,
        sourceMaps: !this.isProduction,
        target: 'browser@es5',
        cache: !this.isProduction,
        tsConfig: 'src/client/tsconfig.json',
        plugins: [
          [SassPlugin({ importer: true }), PostCSSPlugin(POSTCSS_PLUGINS), CSSPlugin()],
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
        outDir: OUT_DIR,
        listEmittedFiles: true,
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
task('copy-static', () => src(ALL, { base: './src/client/assets/' }).dest(`${CLIENT_OUT}/assets`));

task('copy-keys', () => src(ALL, { base: './src/server/keys/' }).dest(join(OUT_DIR, 'keys')));

task('copy-schema', () =>
  src('./**/*.graphql', { base: './src/server/graphql' }).dest(join(OUT_DIR, 'graphql'))
);

task('mv-sw', () =>
  src('workbox-sw.prod.v2.1.2.js', {
    base: './node_modules/workbox-sw/build/importScripts/'
  }).dest(CLIENT_OUT)
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
task('purge', () => {
  class TailwindExtractor {
    static extract(content) {
      return content.match(/[A-z0-9-:\/]+/g);
    }
  }

  const purged = new Purgecss({
    content: ['src/client/**/*.elm', 'src/client/**/*.html'],
    css: [`${CLIENT_OUT}/styles.css`],
    extractors: [
      {
        extractor: TailwindExtractor,
        extensions: ['html', 'elm']
      }
    ],
    whitelist: ['project-card__vinyldb', 'project-card__quantified', 'project-card__roaster-nexus']
  });

  const [result] = purged.purge();

  unlinkSync(`${CLIENT_OUT}/styles.css`);

  writeFileSync(result.file, result.css, 'UTF-8');

  info('💎  THE CSS HAS BEEN PURGED 💎');
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

task('gzip', async () => {
  /* OPTIONS:
   * control over gzip
   * hash filenames or not
   * remove non-compressed files after
   */
  const compressibleAssets = ['.js', '.css', '.html'];
  // const uniqueHash = createHash('md5')
  //   .update(randomBytes(12))
  //   .digest('hex')
  //   .substring(0, 12);

  try {
    compressibleAssets.map(async asset => {
      const filePaths = await asyncGlob(`${CLIENT_OUT}/**/*${asset}`);

      filePaths.map(p => {
        const originalFileName = basename(p);
        const outputPath = dirname(p);

        const fileContent = readFileSync(p, 'UTF-8');
        const gzContent = gzipSync(fileContent);

        writeFileSync(`${outputPath}/${originalFileName}.gz`, gzContent);
      });
    });
    info('gZipped and ready 2 go!');
  } catch (err) {
    console.error(err);
  }
});

/* MAIN BUILD TASK CHAINS */
task('front-dev', ['client-clean', 'f:dev'], () =>
  info('The front end assets have been bundled. GET TO WORK!')
);

task('front-prod', ['client-clean', 'f:prod', 'purge', 'gzip'], () =>
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
