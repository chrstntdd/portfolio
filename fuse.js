const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  SassPlugin,
  QuantumPlugin,
  PostCSSPlugin,
  WebIndexPlugin
} = require('fuse-box');
const { src, task, exec, context } = require('fuse-box/sparky');
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
        plugins: [
          [SassPlugin({ importer: true }), PostCSSPlugin(POSTCSS_PLUGINS), CSSPlugin()],
          this.isProduction ? ElmPlugin() : ElmPlugin({ warn: true, debug: true }),
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
    await workbox.injectManifest({
      globDirectory: `${OUT_DIR}`,
      staticFileGlobs: ['**/*.{html,js,css,svg,jpg}'],
      globIgnores: ['**/sw.js'],
      swSrc: 'src/sw.js',
      swDest: `${OUT_DIR}/sw.js`
    });
    info('  ⚙️ Service worker generated 🛠');
  } catch (error) {
    info('  😒 There was an error generating the service worker 😒', error);
  }
});

task('fancy-fallbacks', async () => {
  const pathsToCSS = await asyncGlob(`${OUT_DIR}/**/*.css`);

  pathsToCSS.map(async cssFile => {
    const fileContent = await fs.readFile(cssFile, 'UTF-8');
    const result = await postcss([resembleImage({ selectors: ['header #hero-img'] })]).process(
      fileContent,
      { from: `${OUT_DIR}/styles.css`, to: `${OUT_DIR}/styles.css` }
    );
    fs.writeFile(`${OUT_DIR}/styles.css`, result.css);
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
      const filePaths = await asyncGlob(`${OUT_DIR}/**/*${asset}`);

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
