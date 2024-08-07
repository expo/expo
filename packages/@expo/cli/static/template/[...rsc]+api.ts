import { getRscMiddleware } from '@expo/server/build/middleware/rsc';
import { renderRscAsync } from '@expo/server/build/middleware/rsc-standalone';

const distFolder = process.env.EXPO_SERVER_DIST;

const rscMiddleware = getRscMiddleware({
  config: {},
  baseUrl: '',
  rscPath: '/_flight/',
  renderRsc: renderRscAsync.bind(null, distFolder),
});

module.exports = rscMiddleware;
