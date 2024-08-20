import { getRscMiddleware } from '@expo/server/build/middleware/rsc';
import { renderRscAsync } from 'expo-router/build/rsc/middleware';

import { join } from 'node:path';

// Target the `dist/server` directory.
const distFolder = join(__dirname, '../../..');

const rscMiddleware = getRscMiddleware({
  config: {},
  baseUrl: '',
  rscPath: '/_flight/',
  renderRsc: renderRscAsync.bind(null, distFolder),
});

module.exports = rscMiddleware;
