import type { MetroConfig } from '@expo/metro-config';

import type { createMetroMiddleware } from './createMetroMiddleware';
import { removeMiddleware } from '../../middleware/mutations';

/**
 * Instantiate the Metro middleware using `@react-native-community/cli-server-api`.
 * This also removes the security headers middleware, to let Expo handle this instead.
 *
 * @todo cedric: drop this once Remote JS debugging is no longer supported in React Native.
 */
export function createLegacyMetroMiddleware(
  serverApi: typeof import('@react-native-community/cli-server-api'),
  metroConfig: MetroConfig,
  { isExporting }: { isExporting: boolean }
): ReturnType<typeof createMetroMiddleware> {
  const { middleware, messageSocketEndpoint, eventsSocketEndpoint, websocketEndpoints } =
    serverApi.createDevServerMiddleware({
      port: metroConfig.server.port,
      watchFolders: metroConfig.watchFolders,
    });

  if (!isExporting) {
    // The `securityHeadersMiddleware` does not support cross-origin requests, we replace with the enhanced version.
    // From react-native 0.75, the exported `securityHeadersMiddleware` is a middleware factory that accepts single option parameter.
    const securityHeadersMiddlewareHandler =
      serverApi.securityHeadersMiddleware.length === 1
        ? serverApi.securityHeadersMiddleware({})
        : serverApi.securityHeadersMiddleware;

    if (!removeMiddleware(middleware, securityHeadersMiddlewareHandler)) {
      throw new Error('Failed to patch the cross-origin security headers middleware.');
    }
  }

  return {
    middleware,
    messagesSocket: {
      endpoint: '/message',
      server: messageSocketEndpoint.server,
      broadcast: messageSocketEndpoint.broadcast,
    },
    eventsSocket: {
      endpoint: '/events',
      server: eventsSocketEndpoint.server,
      reportMetroEvent: eventsSocketEndpoint.reportEvent,
    },
    websocketEndpoints,
  };
}
