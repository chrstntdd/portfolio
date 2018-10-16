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
const CleanWebpackPlugin = require('clean-webpack-plugin');
const Stylish = require('webpack-stylish');

const IS_PRODUCTION = process.env.NODE_ENV === 'production';
const USE_SERVICE_WORKER = process.env.USE_SW;

// const { sw } = require(path.join(__dirname, 'src/client/inline-sw'));'
// Enable users to turn on dead code elimination.
const deadCodeElimination = IS_PRODUCTION
  ? {
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
      ]
    }
  : {};

module.exports = {
  mode: IS_PRODUCTION ? 'production' : 'development',
  entry: path.resolve(__dirname, 'src/index.ts'),
  output: {
    publicPath: '/',
    path: path.resolve(__dirname, 'dist'),
    filename: 'static/js/[name].[chunkhash:8].js',
    chunkFilename: 'static/js/[name].[chunkhash:8].chunk.js',
    devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    devtoolFallbackModuleFilenameTemplate: '[absolute-resource-path]?[hash]'
  },

  devServer: {
    compress: true,
    contentBase: path.resolve(__dirname, 'dist'),
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
    runtimeChunk: true,
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
            ...deadCodeElimination
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
      new OptimizeCSSAssetsPlugin({})
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
        include: path.resolve(__dirname, 'src'),
        use: [{ loader: require.resolve('awesome-typescript-loader') }]
      },

      {
        test: /\.elm$/,
        include: path.resolve(__dirname, 'src'),
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
          require.resolve('css-loader'),
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
    ...(IS_PRODUCTION ? [new CleanWebpackPlugin(['dist'])] : []),
    new HtmlWebpackPlugin({
      template: './src/index.html',
      title: 'Christian Todd | Web Developer',
      inlineSource: 'runtime~.+\\.js',
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
    new MiniCssExtractPlugin({
      filename: IS_PRODUCTION ? './static/css/main.[contenthash:8].css' : '[id].css',
      chunkFilename: IS_PRODUCTION ? './static/css/[id].[contenthash:8].css' : '[id].css'
    }),
    new InterpolateHtmlPlugin({
      SW: ''
    }),
    ...(IS_PRODUCTION
      ? [
          new PurgecssPlugin({
            paths: glob.sync(`src/**/*`, { nodir: true })
          })
        ]
      : []),
    new Stylish(),
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
