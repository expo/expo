import cliPreset from 'expo-module-scripts/jest-preset-cli.js';
import fs from 'fs';
import path from 'path';
import url from 'url';

const rootDir = path.dirname(url.fileURLToPath(import.meta.url));
const { name: displayName } = JSON.parse(
  fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')
);

/** @type {import('jest').Config} */
export default {
  ...cliPreset,
  displayName,
  extensionsToTreatAsEsm: ['.ts'],
  rootDir,
};
