import chalk from 'chalk';

import { createInspectorDeviceClass } from './InspectorDevice';
import { createInspectorProxyClass } from './InspectorProxy';
import { Log } from '../../../../log';
import { type MetroBundlerDevServer } from '../MetroBundlerDevServer';

export function createDebugMiddleware(metroBundler: MetroBundlerDevServer) {
  // Load the React Native debugging tools from project
  // TODO: check if this works with isolated modules
  const { createDevMiddleware, unstable_Device, unstable_InspectorProxy } =
    require('@react-native/dev-middleware') as typeof import('@react-native/dev-middleware');

  // Create the extended inspector proxy, using our own device class
  const ExpoInspectorProxy = createInspectorProxyClass(
    unstable_InspectorProxy,
    createInspectorDeviceClass(metroBundler, unstable_Device)
  );

  const { middleware, websocketEndpoints } = createDevMiddleware({
    projectRoot: metroBundler.projectRoot,
    serverBaseUrl: metroBundler.getJsInspectorBaseUrl(),
    logger: createLogger(chalk.bold('Debug:')),
    unstable_InspectorProxy: ExpoInspectorProxy,
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
