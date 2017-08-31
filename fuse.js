const {
  FuseBox,
  SVGPlugin,
  CSSPlugin,
  SassPlugin,
  CSSModules,
  QuantumPlugin,
  WebIndexPlugin,
  Sparky
} = require('fuse-box');

let fuse,
  app,
  vendor,
  isProduction = false;

Sparky.task('config', () => {
  fuse = new FuseBox({
    homeDir: 'src/',
    output: 'dist/$name.js',
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
        CSSModules(),
        CSSPlugin()
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

Sparky.task('default', ['clean', 'config'], () => {
  fuse.dev({ root: './dist' });
  // add dev instructions
  app.watch().hmr();
  return fuse.run();
});

Sparky.task('clean', () => Sparky.src('dist/*').clean('dist/'));
Sparky.task('prod-env', ['clean'], () => {
  isProduction = true;
});

Sparky.task('dist', ['prod-env', 'config'], () => fuse.run());
