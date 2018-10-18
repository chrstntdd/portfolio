import fs from 'fs-extra';
import path from 'path';
import webpack from 'webpack';
import workbox from 'workbox-build';

import { recursiveReadDir, getOriginalFileSizes, printFinalFileSizes } from './file-size';
import config from '../webpack.config';
import paths from './paths';

const USE_SERVICE_WORKER = process.env.USE_SW;

// Production  build scripts
function build() {
  const compiler = webpack(config);

  return new Promise((res, rej) => {
    compiler.run((err, stats) => {
      if (err) return rej(err);

      return res();
    });
  });
}

async function generateServiceWorker() {
  try {
    const stats = await workbox.injectManifest({
      globDirectory: paths.build,
      globPatterns: ['**/*.{html,js,css,png,svg,jpg,jpeg,gif,ico}'],
      globIgnores: ['**/sw.js'],
      swSrc: path.resolve(paths.src, 'sw.js'),
      swDest: path.resolve(paths.build, 'sw.js')
    });

    console.info(
      ` ⚙️ Service worker generated 🛠 \n ${
        stats.count
      } files will be precached, totaling ${stats.size / 1000000.0} MB.`
    );
  } catch (error) {
    console.error('  😒 There was an error generating the service worker 😒', error);
  }
}

async function removeInlinedFiles() {
  const files = await recursiveReadDir(paths.build);
  // delete the output js file since it is already inlined into the html
  const filesToBeDeleted = files.filter(fileName => /\.(js)$/.test(fileName));
  filesToBeDeleted.forEach(f => {
    if (fs.existsSync(f)) {
      fs.unlinkSync(f);
    }
  });
}

(async () => {
  try {
    const prevFileSizes = await getOriginalFileSizes(paths.build);
    if (fs.existsSync(paths.build)) {
      fs.emptyDirSync(paths.build);
    }

    await build();
    await removeInlinedFiles();

    printFinalFileSizes(prevFileSizes, paths.build);

    USE_SERVICE_WORKER && (await generateServiceWorker());
  } catch (error) {
    console.log(error);
  }
})();
