// https://github.com/react-native-community/cli/blob/af28c7a557afa438e3b53b8432864a1d17664e0f/packages/cli-server-api/src/index.ts#L1C1-L86C2

import http from 'http';

import compression from 'compression';
import connect from 'connect';
import errorhandler from 'errorhandler';
import nocache from 'nocache';
import serveStatic from 'serve-static';
import { debuggerUIMiddleware } from '@react-native-community/cli-debugger-ui';

import devToolsMiddleware from '@react-native-community/cli-server-api/build/devToolsMiddleware';
import openStackFrameInEditorMiddleware from '@react-native-community/cli-server-api/build/openStackFrameInEditorMiddleware';
import openURLMiddleware from '@react-native-community/cli-server-api/build/openURLMiddleware';
import rawBodyMiddleware from '@react-native-community/cli-server-api/build/rawBodyMiddleware';
// import securityHeadersMiddleware from '@react-native-community/cli-server-api/build/securityHeadersMiddleware';
import statusPageMiddleware from '@react-native-community/cli-server-api/build/statusPageMiddleware';
import systraceProfileMiddleware from '@react-native-community/cli-server-api/build/systraceProfileMiddleware';

import createDebuggerProxyEndpoint from '@react-native-community/cli-server-api/build/websocket/createDebuggerProxyEndpoint';
import createMessageSocketEndpoint from '@react-native-community/cli-server-api/build/websocket/createMessageSocketEndpoint';
import createEventsSocketEndpoint from '@react-native-community/cli-server-api/build/websocket/createEventsSocketEndpoint';
import { createCorsMiddleware } from '../middleware/CorsMiddleware';
import { ExpoConfig } from '@expo/config';
import { suppressRemoteDebuggingErrorMiddleware } from '../middleware/suppressErrorMiddleware';
import { createDebuggerTelemetryMiddleware } from '../../../utils/analytics/metroDebuggerMiddleware';
import { createJsInspectorMiddleware } from '../middleware/inspector/createJsInspectorMiddleware';

type MiddlewareOptions = {
  host?: string;
  watchFolders: ReadonlyArray<string>;
  port: number;
};

export function createDevServerMiddleware(
  projectRoot: string,
  options: MiddlewareOptions,
  exp: ExpoConfig
) {
  const debuggerProxyEndpoint = createDebuggerProxyEndpoint();
  const isDebuggerConnected = debuggerProxyEndpoint.isDebuggerConnected;

  const messageSocketEndpoint = createMessageSocketEndpoint();
  const broadcast = messageSocketEndpoint.broadcast;

  const eventsSocketEndpoint = createEventsSocketEndpoint(broadcast);

  const middleware = connect()
    // NOTE(EvanBacon): Add telemetry middleware.
    .use(createDebuggerTelemetryMiddleware(projectRoot, exp))
    // NOTE(EvanBacon): Add remote debugging errors.
    .use(suppressRemoteDebuggingErrorMiddleware)
    // NOTE(EvanBacon): Use our own security headers middleware to support cross-origin requests.
    .use(createCorsMiddleware(exp))

    // @ts-ignore compression and connect types mismatch
    .use(compression())
    // TODO: Only apply nocache to specific endpoints.
    .use(nocache())

    // TODO: These are legacy and expected across the RN ecosystem, we should consider reducing their accessibility to prevent blocking user defined routes on web.
    .use('/debugger-ui', debuggerUIMiddleware())
    .use('/launch-js-devtools', devToolsMiddleware(options, isDebuggerConnected))
    .use('/open-stack-frame', openStackFrameInEditorMiddleware(options))
    .use('/open-url', openURLMiddleware)
    .use('/status', statusPageMiddleware)
    .use('/symbolicate', rawBodyMiddleware)
    // @ts-ignore mismatch
    .use('/systrace', systraceProfileMiddleware)
    .use('/reload', (_req: http.IncomingMessage, res: http.ServerResponse) => {
      broadcast('reload');
      res.end('OK');
    })
    // @ts-ignore mismatch
    .use(errorhandler())

    // NOTE(EvanBacon): Add the debugger proxy endpoint.
    .use('/_expo/debugger', createJsInspectorMiddleware());

  options.watchFolders.forEach((folder) => {
    // @ts-ignore mismatch between express and connect middleware types
    middleware.use(serveStatic(folder));
  });

  return {
    websocketEndpoints: {
      '/debugger-proxy': debuggerProxyEndpoint.server,
      '/message': messageSocketEndpoint.server,
      '/events': eventsSocketEndpoint.server,
    },
    debuggerProxyEndpoint,
    messageSocketEndpoint,
    eventsSocketEndpoint,
    middleware,
  };
}
