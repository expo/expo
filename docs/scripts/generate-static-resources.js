import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import navigation from '../constants/navigation.js';
import * as versions from '../constants/versions.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const basePath = path.join(dirname, '../', 'public', 'static', 'constants');

function writeResource(filename, data) {
  const filePath = path.join(basePath, filename);

  if (!fs.existsSync(basePath)) {
    fs.mkdirSync(basePath);
  }

  if (fs.existsSync(filePath)) {
    fs.rmSync(filePath);
  }

  fs.writeFileSync(path.join(basePath, filename), JSON.stringify(data), { flag: 'wx' });
}

writeResource('versions.json', versions);
writeResource('navigation.json', navigation);
