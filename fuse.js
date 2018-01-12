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
const { src, task, exec, context } = require('fuse-box/sparky');
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
const template = join(__dirname, 'src/client/index.html');
const title = 'Christian Todd | Web Developer';
const all = './**/**.*';

context(
  class {
    getMainConfig() {
      const isProd = this.isProduction;

      return FuseBox.init({
        homeDir: 'src/client',
        output: `${outDir}/$name.js`,
        log: true,
        hash: isProd,
        sourceMaps: !isProd,
        target: 'browser@es5',
        cache: true,
        tsConfig: "src/client/tsconfig.json",
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

    getServerConfig() {
      return FuseBox.init({
        homeDir: 'src/server',
        output: 'dist/server/$name.js',
        log: true,
        hash: false,
        target: 'server',
        cache: true,
        tsConfig: 'src/server/tsconfig.json',
        useTypescriptCompiler: true
      })
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

task('server-build', async context => {
  const fuse = context.getServerConfig();

  fuse
    .bundle('app')
    .watch('src/server/**')
    .instructions('![index.ts]');

  await fuse.run();
})

task('copy-static', () => src(all, { base: './src/client/assets/' }).dest(`${outDir}/assets`));

task('copy-keys', () => src('./**/*.{pem,crt}', { base: './src/server/keys/' }).dest(`dist/server`));


task('clean', () => src(`${outDir}/*`).clean(`${outDir}/`));

task('purify', () => {
  const content = ['src/client**/*.elm', 'src/client**/*.html'];
  const css = ['dist/main.css'];
  const options = {
    output: 'dist/pure.css',
    minify: true,
    info: true
  };
  purify(content, css, options);

  unlinkSync('./dist/main.css');
  unlinkSync('./dist/main.css.map');

  console.info('💎  ALL CSS IS PURE 💎');
});

task('default', ['clean', 'dev-build', 'copy-static'], () =>
  console.info('👊 Development server is live. GET TO WORK! 👊')
);
task('dist', ['clean', 'prod-build', 'copy-static', 'purify'], () => console.info('READY 4 PROD'));

task('server', ['clean', 'server-build', 'copy-keys'], () => console.log('builtd'));  
