import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import navigation from '../constants/navigation.js';
import * as versions from '../constants/versions.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const basePath = path.join(dirname, '../', 'public', 'static', 'constants');

function writeResource(filename, data) {
  fs.writeFileSync(path.join(basePath, filename), JSON.stringify(data), { flag: 'wx' });
}

fs.mkdirSync(basePath);

writeResource('versions.json', versions);
writeResource('navigation.json', navigation);
