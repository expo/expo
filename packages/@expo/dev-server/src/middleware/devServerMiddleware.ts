import Log from '@expo/bunyan';
import bodyParser from 'body-parser';
import { Server as ConnectServer } from 'connect';

import { importCliServerApiFromProject } from '../metro/importMetroFromProject';
import { prependMiddleware, replaceMiddlewareWith } from '../middlwareMutations';
import clientLogsMiddleware from './clientLogsMiddleware';
import createJsInspectorMiddleware from './createJsInspectorMiddleware';
import { remoteDevtoolsCorsMiddleware } from './remoteDevtoolsCorsMiddleware';
import { remoteDevtoolsSecurityHeadersMiddleware } from './remoteDevtoolsSecurityHeadersMiddleware';
import { suppressRemoteDebuggingErrorMiddleware } from './suppressErrorMiddleware';

/**
 * Extends the default `createDevServerMiddleware` and adds some Expo CLI-specific dev middleware
 * with exception for the manifest middleware which is currently in `xdl`.
 *
 * Adds:
 * - `/logs`: pipe runtime `console` logs to the `props.logger` object.
 * - `/inspector`: launch hermes inspector proxy in chrome.
 * - CORS support for remote devtools
 * - body parser middleware
 *
 * @param props.watchFolders array of directory paths to use with watchman
 * @param props.port port that the dev server will run on
 * @param props.logger bunyan instance that all runtime `console` logs will be piped through.
 *
 * @returns
 */
export function createDevServerMiddleware(
  projectRoot: string,
  {
    watchFolders,
    port,
    logger,
  }: {
    watchFolders: readonly string[];
    port: number;
    logger: Log;
  }
) {
  const { createDevServerMiddleware, securityHeadersMiddleware } = importCliServerApiFromProject(
    projectRoot
  );
  const {
    middleware,
    // @ts-expect-error: Old API
    attachToServer,

    // New
    debuggerProxyEndpoint,
    messageSocketEndpoint,
    eventsSocketEndpoint,
    websocketEndpoints,
  } = createDevServerMiddleware({
    port,
    watchFolders,
  });

  // securityHeadersMiddleware does not support cross-origin requests for remote devtools to get the sourcemap.
  // We replace with the enhanced version.
  replaceMiddlewareWith(
    middleware as ConnectServer,
    securityHeadersMiddleware,
    remoteDevtoolsSecurityHeadersMiddleware
  );
  middleware.use(remoteDevtoolsCorsMiddleware);
  prependMiddleware(middleware, suppressRemoteDebuggingErrorMiddleware);

  middleware.use(bodyParser.json());
  middleware.use('/logs', clientLogsMiddleware(logger));
  middleware.use('/inspector', createJsInspectorMiddleware());

  return {
    logger,
    middleware,
    // Old
    attachToServer,
    // New
    debuggerProxyEndpoint,
    messageSocketEndpoint,
    eventsSocketEndpoint,
    websocketEndpoints,
  };
}
