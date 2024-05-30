import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import navigation from '../constants/navigation.js';
import * as versions from '../constants/versions.js';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const basePath = path.join(dirname, '../', 'public', 'static', 'constants');

const env = process.argv.slice(2)[0] || 'development';

function writeResource(filename, data) {
  fs.writeFileSync(path.join(basePath, filename), JSON.stringify(data), { flag: 'wx' });
}

function getVersionForEnvironment(environment) {
  switch (environment) {
    case 'production':
      return versions.VERSIONS.filter(v => v !== 'unversioned');
    case 'preview':
    default:
      return versions.VERSIONS;
  }
}

fs.mkdirSync(basePath);

writeResource('versions.json', {
  ...versions,
  VERSIONS: getVersionForEnvironment(env),
});
writeResource('navigation.json', navigation);
