import fs from 'fs';
import path from 'path';
import chalk from 'chalk';
import { promisify } from 'util';

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);
const exec = promisify(require('child_process').exec);

const searchString = (string, pattern) => {
  let result = [];

  const matches = string.match(new RegExp(pattern.source, pattern.flags));

  for (let i = 0; i < matches.length; i++) {
    result.push(new RegExp(pattern.source, pattern.flags).exec(matches[i]));
  }

  return result;
};

const Print = {
  heading: str => chalk.underline.bold(str),

  singleFileInfo: function(
    fileName: string = '',
    gzipSize: string,
    diff: number,
    percentChange: number
  ): void {
    const percentChangeLabel = this.colorSizeLabel(
      `${percentChange.toFixed(2).toString()}%`,
      percentChange.toFixed(2)
    );

    const fileNameLabel = fileName.split('build')[1].substr(1);

    console.info(
      // @ts-ignore
      fileNameLabel.padEnd(21),
      // @ts-ignore
      gzipSize.padEnd(12),
      // @ts-ignore
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
   */
  colorSizeLabel: (label: string, size: number): string =>
    size > 0 ? chalk.yellow(label) : size < 0 ? chalk.green(label) : chalk.dim(label)
};

/**
 * @description
 * Recursively search through a directory for all files
 */
async function recursiveReadDir(dir: string): Promise<string[]> {
  const subDirectories = await readdir(dir);
  const files = await Promise.all(
    subDirectories.map(async subdir => {
      const res = path.resolve(dir, subdir);
      return (await stat(res)).isDirectory() ? recursiveReadDir(res) : res;
    })
  );
  // @ts-ignore
  return files.reduce((a, f) => a.concat(f), []);
}

/**
 * @description
 * To get all static assets in the output directory, get file information,
 * and sort largest to smallest by the file's size measured in bytes.
 */
const getStaticAssetStats = async (outDir: string): Promise<FileInfo[]> =>
  (await Promise.all(
    (await recursiveReadDir(outDir))
      .filter(fileName => /\.(js|css|html)$/.test(fileName))
      .map(async path => await getFileInfo(path))
  )).sort((a, b) => b.sizeInBytes - a.sizeInBytes);

/**
 * @description
 * Format bytes to appropriate label
 */
function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'kB', 'mB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / k ** i).toFixed(decimals))} ${sizes[i]}`;
}

const calcFileSize = sizeInBytes => formatBytes(Math.abs(sizeInBytes), 2);

const getGzipSize = async pathToFile =>
  Number((await exec(`gzip -c ${pathToFile} | wc -c`)).stdout);

interface FileInfo {
  filePath: string;
  gzipSizeInBytes: number;
  sizeInBytes: number;
  fileName: string;
  id: string;
  extension: string;
}

const getFileInfo = async (filePath: string): Promise<FileInfo> => {
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
 */
const getOriginalFileSizes = async (outDir: string) => {
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
    // @ts-ignore
    Print.heading(`${'Name'.padEnd(21)} ${'Gzip size'.padEnd(12)} ${'Delta'.padEnd(16)}`)
  );

  const currentStatsCollection = await getStaticAssetStats(outDir);

  currentStatsCollection.forEach(function printAllStat({
    gzipSizeInBytes: currentGzipSizeInBytes,
    extension,
    id,
    fileName
  } = {}) {
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
  });

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
    // @ts-ignore
    buildOverallDeltaLabel(percentDiff.toFixed(2))
  );
};

const buildOverallDeltaLabel = (percentDiff: number) => {
  const label = `${percentDiff > 0 ? '+' : ''}${percentDiff}%`;

  return Print.colorSizeLabel(label, percentDiff);
};

export { getOriginalFileSizes, printFinalFileSizes, recursiveReadDir, getStaticAssetStats };
