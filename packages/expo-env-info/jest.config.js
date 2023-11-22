import fs from 'fs';
import { dirname, join, resolve } from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

module.exports = {
  preset: '../../jest/unit-test-config',
  rootDir: resolve(__dirname),
  displayName: JSON.parse(fs.readFileSync(join(__dirname, 'package.json'))).name,
  extensionsToTreatAsEsm: ['.ts'],
};
