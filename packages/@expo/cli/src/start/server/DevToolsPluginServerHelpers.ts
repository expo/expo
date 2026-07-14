import { loadModule } from '@expo/require-utils';

import type { RequestContext } from './DevToolsPluginSocketHelpers';

const debug = require('debug')('expo:start:server:devtools') as typeof console.log;

/**
 * Handler default-exported by a plugin's `serverEntryPoint`. Receives a fetch API `Request`
 * with the plugin endpoint prefix stripped from the URL. Returning `null`/`undefined` falls
 * through to static `webpageRoot` serving. For WebSocket Upgrade requests, return
 * `context.upgrade(hooks)` to commit the handshake, or any plain `Response` to reject it.
 */
export type DevToolsPluginRequestHandler = (
  request: Request,
  context: RequestContext
) => Response | null | undefined | Promise<Response | null | undefined>;

/** Creates the request context for plain HTTP requests, where no socket can be upgraded. */
export function createHttpRequestContext(): RequestContext {
  return {
    upgrade() {
      throw new Error(
        'context.upgrade() was called for a regular HTTP request, so there is no socket to upgrade. ' +
          'WebSocket hooks can only be attached when the client sends an Upgrade request; ' +
          "check `request.headers.get('upgrade') === 'websocket'` before calling upgrade(), " +
          'and return a normal Response for HTTP requests.'
      );
    },
  };
}

/**
 * Extracts the (possibly scoped) plugin package name from a pathname that has the
 * `/_expo/plugins/` endpoint prefix already stripped.
 */
export function parsePluginName(pathname: string): string {
  const parts = pathname.split('/');
  if (parts[0]![0] === '@' && parts.length > 1) {
    // Scoped package name
    return `${parts[0]}/${parts[1]}`;
  }
  return parts[0]!;
}

export async function loadRequestHandlerAsync({
  packageName,
  serverEntryPoint,
}: {
  packageName: string;
  serverEntryPoint: string;
}): Promise<DevToolsPluginRequestHandler> {
  debug('Loading DevTools plugin server module: %s', serverEntryPoint);
  const serverModule = (await loadModule(serverEntryPoint)) as
    | DevToolsPluginRequestHandler
    | { default?: DevToolsPluginRequestHandler };
  const handler = typeof serverModule === 'function' ? serverModule : serverModule?.default;
  if (typeof handler !== 'function') {
    throw new Error(
      `The serverEntryPoint (${serverEntryPoint}) of plugin ${packageName} ` +
        `must default-export a handler function that takes a Request and returns a Response. ` +
        `Export it as \`export default function handler(request) {}\` ` +
        `or \`exports.default = function handler(request) {}\`.`
    );
  }
  return handler;
}
