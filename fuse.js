const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  SassPlugin,
  QuantumPlugin,
  WebIndexPlugin,
  CSSResourcePlugin,
  Sparky
} = require('fuse-box');

let fuse,
  app,
  vendor,
  isProduction = false;

Sparky.task('config', () => {
  fuse = new FuseBox({
    homeDir: 'src/',
    output: 'docs/$name.js',
    log: true,
    experimentalFeatures: true,
    target: 'browser',
    cache: !isProduction,
    sourceMaps: !isProduction,
    hash: isProduction,
    tsConfig: './tsconfig.json',
    plugins: [
      SVGPlugin(),
      [
        SassPlugin({
          outputStyle: 'compressed'
        }),
        CSSResourcePlugin({ inline: true }),
        CSSPlugin({
          outFile: file => `./docs/${file}`
        })
      ],
      WebIndexPlugin({
        template: 'src/index.html',
        title: 'Christian Todd'
      }),
      isProduction &&
        QuantumPlugin({
          removeExportsInterop: false,
          bakeApiIntoBundle: 'vendor',
          uglify: true,
          treeshake: true
        })
    ]
  });
  // vendor
  vendor = fuse.bundle('vendor').instructions('~ index.ts');

  // bundle app
  app = fuse.bundle('app').instructions('!> [index.ts]');
});

Sparky.task('default', ['clean', 'config', 'copy-assets'], () => {
  fuse.dev({ root: './docs' });
  app.watch();
  app.hmr();
  return fuse.run();
});

Sparky.task('copy-assets', () => Sparky.src('./assets/**/*.**').dest('./docs'));

Sparky.task('clean', () => Sparky.src('docs/*').clean('docs/'));
Sparky.task('prod-env', ['clean'], () => {
  isProduction = true;
});

Sparky.task('dist', ['prod-env', 'config'], () => fuse.run());
