/**
 * Get the dev server address.
 */

import { getBundleOrigin } from 'expo/internal/bundle-origin';

import { PROTOCOL_VERSION } from './ProtocolVersion';
import type { ConnectionInfo } from './devtools.types';

const FALLBACK_URL = 'http://localhost:8081/';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  const devServerUrl = getBundleOrigin() ?? FALLBACK_URL;
  const devServer = devServerUrl.replace(/^https?:\/\//, '').replace(/\/?$/, '') as string;
  return {
    protocolVersion: PROTOCOL_VERSION,
    sender: 'app',
    devServer,
    useWss: devServerUrl.startsWith('https://'),
  };
}
