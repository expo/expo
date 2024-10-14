import chalk from 'chalk';

import { createHandlersFactory } from './createHandlersFactory';
import { Log } from '../../../../log';
import { env } from '../../../../utils/env';
import { type MetroBundlerDevServer } from '../MetroBundlerDevServer';

export function createDebugMiddleware(metroBundler: MetroBundlerDevServer) {
  // Load the React Native debugging tools from project
  // TODO: check if this works with isolated modules
  const { createDevMiddleware } =
    require('@react-native/dev-middleware') as typeof import('@react-native/dev-middleware');

  const { middleware, websocketEndpoints } = createDevMiddleware({
    projectRoot: metroBundler.projectRoot,
    serverBaseUrl: metroBundler.getUrlCreator().constructUrl({ scheme: 'http', hostType: 'lan' }),
    logger: createLogger(chalk.bold('Debug:')),
    unstable_customInspectorMessageHandler: createHandlersFactory(metroBundler),
    unstable_experiments: {
      // Enable the Network tab in React Native DevTools
      enableNetworkInspector: true,
      // Only enable opening the browser version of React Native DevTools when debugging.
      // This is useful when debugging the React Native DevTools by going to `/open-debugger` in the browser.
      enableOpenDebuggerRedirect: env.EXPO_DEBUG,
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
