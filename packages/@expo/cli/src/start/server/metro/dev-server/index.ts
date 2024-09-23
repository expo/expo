import { getPackageJson } from '@expo/config';
import { MetroConfig } from '@expo/metro-config';
import resolveFrom from 'resolve-from';

import { createLegacyMetroMiddleware } from './createLegacyMetroMiddleware';
import { createMetroMiddleware } from './createMetroMiddleware';

const debug = require('debug')('expo:metro:dev-server') as typeof console.log;

/**
 * Create the base websockets and middleware stack for Metro.
 * This uses `@react-native-community/cli-server-api` when installed in the project.
 * Otherwise, it will use the modern Metro middleware implementation.
 *
 * @todo cedric: drop this once Remote JS debugging is no longer supported in React Native.
 * @see createMetroMiddleware
 */
export function createLegacyOrModernMetroMiddleware(
  metroConfig: MetroConfig,
  options: { isExporting: boolean }
) {
  try {
    const pkg = getPackageJson(metroConfig.projectRoot!);
    const hasServerApi =
      !!pkg.dependencies?.['@react-native-community/cli-server-api'] ||
      !!pkg.devDependencies?.['@react-native-community/cli-server-api'];

    if (hasServerApi) {
      const serverApi = require(
        resolveFrom(metroConfig.projectRoot!, '@react-native-community/cli-server-api')
      ) as typeof import('@react-native-community/cli-server-api');

      debug('Using Metro dev server with @react-native-community/cli-server-api');

      return createLegacyMetroMiddleware(serverApi, metroConfig, options);
    }
  } catch (error) {
    debug('Failed to load @react-native-community/cli-server-api:', error);
  }

  debug('Using built-in Metro dev server middleware, without support for legacy features.');

  return createMetroMiddleware(metroConfig);
}
