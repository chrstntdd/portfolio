const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  SassPlugin,
  QuantumPlugin,
  PostCSSPlugin,
  WebIndexPlugin,
  ImageBase64Plugin,
  CSSResourcePlugin
} = require('fuse-box');
const { src, task, exec, context } = require('fuse-box/sparky');
const { ElmPlugin } = require('fuse-box-elm-plugin');
const autoprefixer = require('autoprefixer');
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
const template = join(__dirname, 'src/index.html');
const title = 'Christian Todd | Web Developer';
const all = './**/**.*';

context(
  class {
    getMainConfig() {
      const isProd = this.isProduction;

      return FuseBox.init({
        homeDir: 'src',
        output: `${outDir}/$name.js`,
        log: true,
        hash: isProd,
        sourceMaps: !isProd,
        target: 'browser@es5',
        cache: true,
        plugins: [
          [
            SassPlugin(),
            PostCSSPlugin(POSTCSS_PLUGINS),
            CSSResourcePlugin({
              inline: true
            }),
            CSSPlugin({
              group: 'main.css',
              outFile: `${outDir}/main.css`,
              inject: true
            })
          ],
          isProd ? ElmPlugin() : ElmPlugin({ warn: true, debug: true }),
          SVGPlugin(),
          WebIndexPlugin({
            template,
            title,
            path: './'
          }),
          ImageBase64Plugin({
            useDefault: true
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

  await fuse.fun();
});

task('dev-build', async context => {
  const fuse = context.getMainConfig();
  const serverOpts = { foot: false, open: false };

  fuse.dev(serverOpts, server => {
    const app = server.httpServer.app;
    app.use(express.static(outDir));
    app.get('*', (req, res) => {
      res.sendFile(join(outDir, '/index.html'));
    });
  });

  fuse
    .bundle('app')
    .hmr({ reload: true })
    .watch()
    .instructions('> index.js');

  await fuse.run();
});

task('copy-assets', () => src(all, { base: './src/assets/' }).dest(`${outDir}`));

task('copy-font', () =>
  src(all, { base: './node_modules/font-awesome/fonts/' }).dest('./dist/fonts')
);

task('clean', () => src(`${outDir}/*`).clean(`${outDir}/`));

task('copy-static', ['&copy-font', '&copy-assets']);

task('default', ['clean', 'dev-build', 'copy-static'], () =>
  console.info('👊 Development server is live. GET TO WORK! 👊')
);
task('dist', ['clean', 'prod-build', 'copy-static'], () => console.info('READY 4 PROD'));
