/**
 * Get the dev server address.
 */

import { PROTOCOL_VERSION } from './ProtocolVersion';
import type { ConnectionInfo } from './devtools.types';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  const devServerQuery = new URLSearchParams(window.location.search).get('devServer');
  const host = window.location.origin.replace(/^https?:\/\//, '');
  return {
    protocolVersion: PROTOCOL_VERSION,
    sender: 'browser',
    devServer: devServerQuery || host,
  };
}
