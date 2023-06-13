import { Platform } from '@expo/config';
import chalk from 'chalk';
import prettyBytes from 'pretty-bytes';
import table from 'text-table';

import * as Log from '../log';
import { stripAnsi } from '../utils/ansi';
import { learnMore } from '../utils/link';
import { BundleOutput } from './fork-bundleAsync';

export function printBundleSizes(bundles: Partial<Record<Platform, BundleOutput>>) {
  const files: [string, string | Uint8Array][] = [];

  for (const [platform, bundleOutput] of Object.entries(bundles) as [
    Platform,
    Pick<BundleOutput, 'hermesBytecodeBundle' | 'code' | 'hermesSourcemap' | 'map'>
  ][]) {
    if (bundleOutput.hermesBytecodeBundle) {
      files.push([chalk.bold(`index.${platform}.hbc`), bundleOutput.hermesBytecodeBundle]);
    } else if (bundleOutput.code) {
      files.push([chalk.bold(`index.${platform}.js`), bundleOutput.code]);
    }
    if (bundleOutput.hermesSourcemap) {
      files.push([chalk.dim(`index.${platform}.hbc.map`), bundleOutput.hermesSourcemap]);
    } else if (bundleOutput.map) {
      files.push([chalk.dim(`index.${platform}.js.map`), bundleOutput.map]);
    }
  }

  Log.log();
  Log.log(createFilesTable(files.sort((a, b) => a[1].length - b[1].length)));
  Log.log();
  Log.log(
    chalk`💡 JavaScript bundle sizes affect startup time. {dim ${learnMore(
      `https://expo.fyi/javascript-bundle-sizes`
    )}}`
  );
  Log.log();

  return files;
}

export function createFilesTable(files: [string, string | Uint8Array][]): string {
  const tableData = files.map((item, index) => {
    const fileBranch =
      index === 0 ? (files.length > 1 ? '┌' : '─') : index === files.length - 1 ? '└' : '├';

    return [`${fileBranch} ${item[0]}`, prettyBytes(Buffer.byteLength(item[1], 'utf8'))];
  });
  return table([['Bundle', 'Size'].map((v) => chalk.underline(v)), ...tableData], {
    align: ['l', 'r'],
    stringLength: (str) => stripAnsi(str)?.length ?? 0,
  });
}
