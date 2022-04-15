import { Platform } from '@expo/config';
import { BundleOutput } from '@expo/dev-server';
import chalk from 'chalk';
import prettyBytes from 'pretty-bytes';
import table from 'text-table';

import * as Log from '../../log';
import { stripAnsi } from '../../utils/ansi';
import { learnMore } from '../../utils/link';

export function printBundleSizes(bundles: Partial<Record<Platform, BundleOutput>>) {
  const files: [string, string | Uint8Array][] = [];

  if (bundles.ios?.hermesBytecodeBundle) {
    files.push(['index.ios.js (Hermes)', bundles.ios.hermesBytecodeBundle]);
  } else if (bundles.ios?.code) {
    files.push(['index.ios.js', bundles.ios.code]);
  }
  if (bundles.android?.hermesBytecodeBundle) {
    files.push(['index.android.js (Hermes)', bundles.android.hermesBytecodeBundle]);
  } else if (bundles.android?.code) {
    files.push(['index.android.js', bundles.android.code]);
  }

  // Account for inline source maps
  if (bundles.ios?.hermesSourcemap) {
    files.push([chalk.dim('index.ios.js.map (Hermes)'), bundles.ios.hermesSourcemap]);
  } else if (bundles.ios?.map) {
    files.push([chalk.dim('index.ios.js.map'), bundles.ios.map]);
  }
  if (bundles.android?.hermesSourcemap) {
    files.push([chalk.dim('index.android.js.map (Hermes)'), bundles.android.hermesSourcemap]);
  } else if (bundles.android?.map) {
    files.push([chalk.dim('index.android.js.map'), bundles.android.map]);
  }

  Log.log();
  Log.log(createFilesTable(files));
  Log.log();
  Log.log(
    chalk`💡 JavaScript bundle sizes affect startup time. {dim ${learnMore(
      `https://expo.fyi/javascript-bundle-sizes`
    )}}`
  );
  Log.log();
}

export function createFilesTable(files: [string, string | Uint8Array][]): string {
  const tableData = files.map((item, index) => {
    const fileBranch = index === 0 ? '┌' : index === files.length - 1 ? '└' : '├';

    return [`${fileBranch} ${item[0]}`, prettyBytes(Buffer.byteLength(item[1], 'utf8'))];
  });
  return table([['Bundle', 'Size'].map((v) => chalk.underline(v)), ...tableData], {
    align: ['l', 'r'],
    stringLength: (str) => stripAnsi(str)?.length ?? 0,
  });
}
