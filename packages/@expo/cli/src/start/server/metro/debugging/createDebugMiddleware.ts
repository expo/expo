import chalk from 'chalk';
import resolveFrom from 'resolve-from';

import { createInspectorDeviceClass } from './InspectorDevice';
import { createInspectorProxyClass } from './InspectorProxy';
import { Log } from '../../../../log';
import { type MetroBundlerDevServer } from '../MetroBundlerDevServer';

export function createDebugMiddleware(metroBundler: MetroBundlerDevServer) {
  // Load the React Native debugging tools from project
  // TODO: check if this works with isolated modules
  const { createDevMiddleware, unstable_Device, unstable_InspectorProxy } =
    importDevMiddlewareFromProject(metroBundler);

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

  const middlewareWithLocalDevTools: typeof middleware = (req, res, next) => {
    if (req.url?.startsWith('/debugger-frontend/rn_inspector')) {
      const url = req.url.replace('/debugger-frontend/rn_inspector.html', 'rn_inspector');
      res.writeHead(302, { Location: `http://localhost:8000/${url}` });
      return res.end();
    }

    return middleware(req, res, next);
  };

  return {
    debugMiddleware: middlewareWithLocalDevTools,
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

function importDevMiddlewareFromProject(
  metroBundler: MetroBundlerDevServer
): typeof import('@react-native/dev-middleware') {
  const resolvedPath = resolveFrom.silent(metroBundler.projectRoot, '@react-native/dev-middleware');
  if (!resolvedPath) {
    throw new Error(
      `Couldn't find "@react-native/dev-middleware" package in project: ${metroBundler.projectRoot}`
    );
  }

  return require(resolvedPath);
}
