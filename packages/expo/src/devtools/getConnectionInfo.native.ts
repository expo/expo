/**
 * Get the dev server address.
 */

import type { ConnectionInfo } from './devtools.types';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer');
  const devServer = getDevServer()
    .url.replace(/^https?:\/\//, '')
    .replace(/\/?$/, '') as string;
  return {
    sender: 'app',
    devServer,
  };
}
