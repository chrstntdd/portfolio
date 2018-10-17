const fs = require('fs');
const path = require('path');
const chalk = require('chalk');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const exec = promisify(require('child_process').exec);

const Print = {
  heading: str => chalk.underline.bold(str),
  /**
   * @param {string} fileName
   * @param {string} gzipSize
   * @param {number} diff
   * @param {number} percentChange
   *
   * @returns {void}
   */
  singleFileInfo: function(fileName = '', gzipSize, diff, percentChange) {
    const percentChangeLabel = this.colorSizeLabel(
      `${percentChange.toFixed(2).toString()}%`,
      percentChange.toFixed(2)
    );

    console.info(
      fileName.padEnd(21),
      gzipSize.padEnd(12),
      calcFileSize(diff).padEnd(8),
      `(${percentChangeLabel.padEnd(10)})`
    );
  },
  /**
   * @description
   * To add color to a label pertaining to a given size
   *
   * Increase (positive) -> Yellow
   * Decrease (negative) -> Green
   * No Change -> Dimmed
   *
   * @param {string} label Label to be colored
   * @param {number} size Size or percentage to determine the difference
   *
   * @returns {string} Label to be displayed
   */
  colorSizeLabel: (label, size) =>
    size > 0 ? chalk.yellow(label) : size < 0 ? chalk.green(label) : chalk.dim(label)
};

/**
 * @description
 * Recursively search through a directory for all files
 *
 * @param {string} dir Directory to search in
 *
 * @returns {Promise<string[]>} Flat list of all files in a directory and any sub-directories
 */
async function recursiveReadDir(dir) {
  const subDirectories = await readdir(dir);
  const files = await Promise.all(
    subDirectories.map(async subdir => {
      const res = path.resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? recursiveReadDir(res) : res;
    })
  );
  return files.reduce((a, f) => a.concat(f), []);
}

/**
 * @description
 * To get all static assets in the output directory, get file information,
 * and sort largest to smallest by the file's size measured in bytes.
 *
 * @param {string} outDir Directory to search in
 * @returns {Object[]} Object representation of a file returns
 */
const getStaticAssetStats = async outDir =>
  (await Promise.all(
    (await recursiveReadDir(outDir))
      .filter(fileName => /\.(js|css)$/.test(fileName))
      .map(async path => await getFileInfo(path))
  )).sort((a, b) => b.sizeInBytes - a.sizeInBytes);

/**
 * @description
 * Format bytes to appropriate label
 *
 * @param {number} bytes
 * @param {number?} decimals How many decimals should be used in the output
 *
 * @returns {string}
 */
function formatBytes(bytes, decimals = 2) {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'kB', 'mB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

const calcFileSize = sizeInBytes => formatBytes(Math.abs(sizeInBytes), 2);

const getGzipSize = async pathToFile =>
  Number((await exec(`gzip -c ${pathToFile} | wc -c`)).stdout);

const getFileInfo = async filePath => {
  try {
    const fileName = /([^\/]+$)/.exec(filePath)[0];
    const id = /.+?(?=\.)/.exec(fileName)[0];
    const extension = fileName.split('.').reverse()[0];
    const gzipSizeInBytes = await getGzipSize(filePath);
    const sizeInBytes = (await stat(filePath)).size;

    return {
      filePath,
      gzipSizeInBytes,
      sizeInBytes,
      fileName,
      id,
      extension
    };
  } catch (error) {
    console.error(error);
  }
};

/**
 * @description
 * Measures the file sizes of js and css files for comparison later
 *
 * @param {string} outDir
 */
const getOriginalFileSizes = async outDir => {
  // Clear console
  process.stdout.write('\033c\033[3J');
  return await getStaticAssetStats(outDir);
};

const measureFileSizeDifference = (prevSizeInBytes, currentSizeInBytes) => {
  const diff = currentSizeInBytes - prevSizeInBytes;
  const avg = (currentSizeInBytes + prevSizeInBytes) / 2;
  const percentDiff = (diff / avg) * 100;

  return { percentDiff, diff };
};

const printFinalFileSizes = async (originalFileSizesArr, outDir) => {
  let originalTotalSize = 0;
  let currentTotalSize = 0;

  console.info(
    Print.heading(`${'Name'.padEnd(21)} ${'Gzip size'.padEnd(12)} ${'Delta'.padEnd(16)}`)
  );

  const currentStatsCollection = await getStaticAssetStats(outDir);

  currentStatsCollection.forEach(
    ({ gzipSizeInBytes: currentGzipSizeInBytes, extension, id, fileName }) => {
      const maybeMatch = originalFileSizesArr.find(f => f.id === id && f.extension === extension);

      if (maybeMatch) {
        const originalGzipSizeInBytes = maybeMatch.gzipSizeInBytes;

        originalTotalSize += originalGzipSizeInBytes;
        currentTotalSize += currentGzipSizeInBytes;

        const { diff, percentDiff } = measureFileSizeDifference(
          originalGzipSizeInBytes,
          currentGzipSizeInBytes
        );

        Print.singleFileInfo(fileName, calcFileSize(currentGzipSizeInBytes), diff, percentDiff);
      } else {
        // A new file was added
        currentTotalSize += currentGzipSizeInBytes;
        Print.singleFileInfo(
          fileName,
          calcFileSize(currentGzipSizeInBytes),
          currentGzipSizeInBytes,
          100
        );
      }
    }
  );

  const { diff, percentDiff } = measureFileSizeDifference(originalTotalSize, currentTotalSize);

  console.log(
    Print.heading('\nOverall stats'),
    '\nOriginal size: ',
    calcFileSize(originalTotalSize),
    '\nCurrent size: ',
    calcFileSize(currentTotalSize),
    '\nDelta: ',
    calcFileSize(diff),
    '   ',
    buildOverallDeltaLabel(percentDiff.toFixed(2))
  );
};

/**
 *
 * @param {number} percentDiff
 */
const buildOverallDeltaLabel = percentDiff => {
  const label = `${percentDiff > 0 ? '+' : ''}${percentDiff}%`;

  return Print.colorSizeLabel(label, percentDiff);
};

module.exports = {
  getOriginalFileSizes,
  printFinalFileSizes,
  recursiveReadDir,
  getStaticAssetStats
};
