/**
 * Get the dev server address.
 */

import type { ConnectionInfo } from './devtools.types';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  const devServerQuery = new URLSearchParams(window.location.search).get('devServer');
  const host = window.location.origin.replace(/^https?:\/\//, '');
  return {
    sender: 'browser',
    devServer: devServerQuery || host,
  };
}
