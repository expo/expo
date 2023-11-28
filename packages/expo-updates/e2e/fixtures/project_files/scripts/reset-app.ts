#!/usr/bin/env yarn --silent ts-node --transpile-only

import fs from 'fs/promises';
import path from 'path';

const dirName = __dirname; /* eslint-disable-line */
const projectDir = path.resolve(dirName, '..');

const allowedValues = new Set(['App.tsx.embedded', 'App.tsx.update1', 'App.tsx.update2']);

(async function () {
  if (process.argv.length < 3) {
    usage();
    process.exit(1);
  }
  const fileToCopy = process.argv[2];
  if (!allowedValues.has(fileToCopy)) {
    usage();
    process.exit(1);
  }
  const sourceAppTsxPath = path.resolve(projectDir, 'scripts', 'files', fileToCopy);
  const destAppTsxPath = path.join(projectDir, 'App.tsx');
  fs.copyFile(sourceAppTsxPath, destAppTsxPath);
  console.log(`${fileToCopy} copied to App.tsx`);
})();

function usage() {
  console.log(`Usage: reset-app <${[...allowedValues].join('|')}>`);
}
