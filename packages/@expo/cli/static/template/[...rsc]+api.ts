import { getRscMiddleware } from '@expo/server/private';
import { renderRscAsync } from 'expo-router/build/rsc/middleware';

import { resolve } from 'node:path';

// Target the `dist/server` directory.
const distFolder = resolve('./');

const rscMiddleware = getRscMiddleware({
  config: {},
  baseUrl: '',
  rscPath: '/_flight/',
  renderRsc: renderRscAsync.bind(null, distFolder),
});

module.exports = rscMiddleware;
