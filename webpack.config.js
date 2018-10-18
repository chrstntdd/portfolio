const path = require('path');
const glob = require('glob');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const PurgecssPlugin = require('purgecss-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const InterpolateHtmlPlugin = require('interpolate-html-plugin');
const InlineSourcePlugin = require('html-webpack-inline-source-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const Stylish = require('webpack-stylish');
const paths = require('./scripts/paths');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const USE_SERVICE_WORKER = process.env.USE_SW;

module.exports = {
  mode: IS_PRODUCTION ? 'production' : 'development',
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    publicPath: '/',
    path: paths.build,
    filename: 'main.[chunkhash:8].js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
  },

  devServer: {
    compress: true,
    contentBase: paths.build,
    historyApiFallback: true,
    useLocalIp: true,
    host: '0.0.0.0',
    overlay: {
      warnings: true,
      errors: true
    }
  },

  // Enable sourcemaps for debugging webpack's output.
  devtool: IS_PRODUCTION ? 'source-map' : 'cheap-module-source-map',

  optimization: {
    // Keep the runtime chunk separated to enable long term caching
    // https://twitter.com/wSokra/status/969679223278505985
    // runtimeChunk: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          parse: {
            // we want terser to parse ecma 8 code. However, we don't want it
            // to apply any minfication steps that turns valid ecma 5 code
            // into invalid ecma 5 code. This is why the 'compress' and 'output'
            // sections only apply transformations that are ecma 5 safe
            // https://github.com/facebook/create-react-app/pull/4234
            ecma: 8
          },
          compress: {
            ecma: 5,
            warnings: false,
            // Disabled because of an issue with Uglify breaking seemingly valid code:
            // https://github.com/facebook/create-react-app/issues/2376
            // Pending further investigation:
            // https://github.com/mishoo/UglifyJS2/issues/2011
            comparisons: false,
            // Disabled because of an issue with Terser breaking valid code:
            // https://github.com/facebook/create-react-app/issues/5250
            // Pending futher investigation:
            // https://github.com/terser-js/terser/issues/120
            inline: 2,
            dead_code: true,
            pure_funcs: [
              '_elm_lang$core$Native_Utils.update',
              'A2',
              'A3',
              'A4',
              'A5',
              'A6',
              'A7',
              'A8',
              'A9',
              'F2',
              'F3',
              'F4',
              'F5',
              'F6',
              'F7',
              'F8',
              'F9'
            ],
            pure_getters: true,
            keep_fargs: false,
            unsafe_comps: true,
            unsafe: true
          },
          mangle: {
            safari10: true
          },
          output: {
            ecma: 6,
            comments: false,
            // Turned on because emoji and regex is not minified properly using default
            // https://github.com/facebook/create-react-app/issues/2488
            ascii_only: true
          }
        },
        // Use multi-process parallel running to improve the build speed
        // Default number of concurrent runs: os.cpus().length - 1
        parallel: true,
        // Enable file caching
        cache: true,
        sourceMap: true
      }),
      new OptimizeCSSAssetsPlugin({
        cssProcessorOptions: {
          map: {
            inline: false,
            annotate: true
          }
        }
      })
    ]
  },

  resolve: {
    // Add '.ts' and '.tsx' as resolvable extensions.
    extensions: ['.ts', '.tsx', '.js', '.json', '.elm'],
    modules: ['node_modules'],
    alias: {
      '@': path.resolve(__dirname, 'src/')
    }
  },

  module: {
    noParse: /\.elm$/,
    strictExportPresence: true,
    rules: [
      {
        test: /\.(ts|tsx)?$/,
        include: paths.src,
        use: [{ loader: require.resolve('awesome-typescript-loader'), options: { silent: true } }]
      },

      {
        test: /\.elm$/,
        include: paths.src,
        use: [
          {
            loader: require.resolve('elm-webpack-loader'),
            options: {
              pathToElm: path.resolve(__dirname, 'node_modules/.bin/elm'),
              ...(IS_PRODUCTION ? { optimize: IS_PRODUCTION } : { debug: true, forceWatch: true })
            }
          }
        ]
      },

      {
        test: /\.(sa|sc|c)ss$/,
        use: [
          IS_PRODUCTION ? MiniCssExtractPlugin.loader : require.resolve('style-loader'),
          { loader: require.resolve('css-loader'), options: { sourceMap: true } },
          require.resolve('postcss-loader'),
          { loader: require.resolve('sass-loader'), options: { sourceMap: true } }
        ]
      },
      // "url" loader works just like "file" loader but it also embeds
      // assets smaller than specified size as data URLs to avoid requests.
      {
        test: [/\.bmp$/, /\.gif$/, /\.jpe?g$/, /\.png$/],
        loader: require.resolve('url-loader'),
        options: {
          limit: 10000
        }
      },
      {
        test: /\.(png|jpg|gif)$/,
        use: {
          loader: require.resolve('file-loader'),
          options: {
            name: '[path][name].[ext]',
            useRelativePaths: true,
            emitFile: true
          }
        }
      }
    ]
  },

  plugins: [
    new MiniCssExtractPlugin({
      filename: IS_PRODUCTION ? 'main.[contenthash:8].css' : '[id].css'
    }),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Christian Todd | Web Developer',
      inlineSource: '.(js)$', // inline compiled elm code since its so small
      minify: IS_PRODUCTION && {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true
      }
    }),
    new InlineSourcePlugin(),
    new InterpolateHtmlPlugin({
      INLINE_SW: IS_PRODUCTION && USE_SERVICE_WORKER ? require('./src/inline-sw.js') : ''
    }),
    ...(IS_PRODUCTION
      ? [
          new PurgecssPlugin({
            paths: glob.sync(`src/**/*.elm`, { nodir: true }),
            extractors: [
              {
                extractor: class TailwindExtractor {
                  static extract(content) {
                    return content.match(/[A-z0-9-:\/]+/g);
                  }
                },
                extensions: ['html', 'elm']
              }
            ],
            whitelist: [
              'project-card__vinyldb',
              'project-card__quantified',
              'project-card__roaster-nexus'
            ]
          })
        ]
      : []),
    ...(IS_PRODUCTION ? [] : [new Stylish()]),
    new CopyWebpackPlugin([
      {
        from: 'src/public',
        toType: 'dir'
      }
    ])
  ],
  node: {
    dgram: 'empty',
    fs: 'empty',
    net: 'empty',
    tls: 'empty',
    child_process: 'empty'
  },
  performance: false
};
