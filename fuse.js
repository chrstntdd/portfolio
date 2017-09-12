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

const outDir = 'dist';

let fuse,
  app,
  vendor,
  isProduction = false;

Sparky.task('config', () => {
  fuse = new FuseBox({
    homeDir: 'src/',
    output: `${outDir}/$name.js`,
    log: true,
    experimentalFeatures: true,
    target: 'browser',
    // cache: !isProduction,
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
          outFile: file => `./${outDir}/${file}`
        })
      ],
      WebIndexPlugin({
        template: 'src/index.html',
        title: 'Christian Todd | Web Developer'
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
  fuse.dev({ root: `./${outDir}` });
  app.watch();
  app.hmr();
  return fuse.run();
});

Sparky.task('copy-assets', () =>
  Sparky.src(`./assets/**/*.**`).dest(`./${outDir}`)
);

Sparky.task('clean', () => Sparky.src(`${outDir}/*`).clean(`${outDir}/`));
Sparky.task('prod-env', ['clean'], () => {
  isProduction = true;
});

Sparky.task('dist', ['prod-env', 'config'], () => fuse.run());
