/**
 * Get the dev server address.
 */

import { PROTOCOL_VERSION } from './ProtocolVersion.js';
import type { ConnectionInfo } from './devtools.types.js';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  const devServerQuery = new URLSearchParams(window.location.search).get('devServer');
  const host = window.location.origin.replace(/^https?:\/\//, '');
  return {
    protocolVersion: PROTOCOL_VERSION,
    sender: 'browser',
    devServer: devServerQuery || host,
    useWss: window.location.protocol === 'https:',
  };
}
