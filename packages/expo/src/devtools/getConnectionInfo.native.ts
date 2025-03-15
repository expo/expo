/**
 * Get the dev server address.
 */

import type { ConnectionInfo } from './devtools.types';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  const devServerModule = require('react-native/Libraries/Core/Devtools/getDevServer');
  const getDevServer = devServerModule.default ?? devServerModule;
  const devServer = getDevServer()
    .url.replace(/^https?:\/\//, '')
    .replace(/\/?$/, '') as string;
  return {
    sender: 'app',
    devServer,
  };
}
