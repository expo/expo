import chalk from 'chalk';

import { createHandlersFactory } from './createHandlersFactory';
import { Log } from '../../../../log';
import { resolveProjectTransitiveDependency } from '../../../../utils/resolvePackage';
import { type MetroBundlerDevServer } from '../MetroBundlerDevServer';

export function createDebugMiddleware(metroBundler: MetroBundlerDevServer) {
  // Load the React Native debugging tools from project
  const devMiddlewarePath = resolveProjectTransitiveDependency(
    metroBundler.projectRoot,
    'react-native',
    '@react-native/community-cli-plugin',
    '@react-native/dev-middleware'
  );
  if (!devMiddlewarePath) {
    throw new Error('Unable to resolve the @react-native/dev-middleware package.');
  }
  const { createDevMiddleware } = require(
    devMiddlewarePath
  ) as typeof import('@react-native/dev-middleware');

  const { middleware, websocketEndpoints } = createDevMiddleware({
    projectRoot: metroBundler.projectRoot,
    serverBaseUrl: metroBundler.getUrlCreator().constructUrl({ scheme: 'http', hostType: 'lan' }),
    logger: createLogger(chalk.bold('Debug:')),
    unstable_customInspectorMessageHandler: createHandlersFactory(metroBundler),
    unstable_experiments: {
      enableNewDebugger: true,
    },
  });

  return {
    debugMiddleware: middleware,
    debugWebsocketEndpoints: websocketEndpoints,
  };
}

function createLogger(
  logPrefix: string
): Parameters<typeof import('@react-native/dev-middleware').createDevMiddleware>[0]['logger'] {
  return {
    info: (...args) => Log.log(logPrefix, ...args),
    warn: (...args) => Log.warn(logPrefix, ...args),
    error: (...args) => Log.error(logPrefix, ...args),
  };
}
