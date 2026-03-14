/**
 * Get the dev server address.
 */

import { PROTOCOL_VERSION } from './ProtocolVersion.js';
import type { ConnectionInfo } from './devtools.types.js';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  const getDevServer = require('react-native/Libraries/Core/Devtools/getDevServer').default;
  const devServerUrl = getDevServer().url;
  const devServer = devServerUrl.replace(/^https?:\/\//, '').replace(/\/?$/, '') as string;
  return {
    protocolVersion: PROTOCOL_VERSION,
    sender: 'app',
    devServer,
    useWss: devServerUrl.startsWith('https://'),
  };
}
