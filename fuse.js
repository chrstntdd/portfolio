const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  SassPlugin,
  QuantumPlugin,
  PostCSSPlugin,
  WebIndexPlugin,
  ImageBase64Plugin,
  CSSResourcePlugin,
  Sparky
} = require('fuse-box');
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

let producer;
let isProduction = false;

Sparky.task('build', () => {
  const fuse = FuseBox.init({
    homeDir: 'src',
    output: `${outDir}/$name.js`,
    log: true,
    hash: isProduction,
    sourceMaps: !isProduction,
    target: 'browser@es5',
    experimentalFeatures: true,
    cache: false,
    plugins: [
      isProduction
        ? ElmPlugin()
        : ElmPlugin({
            warn: true,
            debug: true
          }),
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
      SVGPlugin(),
      WebIndexPlugin({
        template: 'src/index.html',
        title: 'Christian Todd | Web Developer',
        path: './'
      }),
      ImageBase64Plugin({
        useDefault: true
      }),
      isProduction &&
        QuantumPlugin({
          ensureES5: true,
          removeExportsInterop: false,
          bakeApiIntoBundle: 'app',
          uglify: true,
          treeshake: true
        })
    ]
  });

  /* Configure dev server */
  if (isProduction === false) {
    const serverOpts = { root: false, open: false };

    fuse.dev(serverOpts, server => {
      const app = server.httpServer.app;
      app.use(express.static(outDir));
      app.get('*', (req, res) => {
        res.sendFile(join(outDir, '/index.html'));
      });
    });
  }

  /* Main bundle */
  const app = fuse.bundle('app').instructions('> index.js');
  if (!isProduction) {
    app.watch();
    app.hmr();
  }

  return fuse.run();
});

Sparky.task('copy-assets', () =>
  Sparky.src('./**/**.*', {
    base: './src/assets/'
  }).dest(`${outDir}`)
);

Sparky.task('copy-font', () =>
  Sparky.src('./**/**.*', { base: './node_modules/font-awesome/fonts/' }).dest(
    './dist/fonts'
  )
);

Sparky.task('clean', () => Sparky.src(`${outDir}/*`).clean(`${outDir}/`));
Sparky.task('prod-env', ['clean'], () => {
  isProduction = true;
});

Sparky.task('default', ['clean', 'copy-assets', 'copy-font', 'build'], () =>
  console.info('👊 Development server is live. GET TO WORK! 👊')
);
Sparky.task('dist', ['prod-env', 'clean', 'build'], () =>
  console.info('READY 4 PROD')
);
