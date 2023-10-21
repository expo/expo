/**
 * Get the dev server address.
 */

import type { ConnectionInfo } from './devtools.types';

export function getConnectionInfo(): Omit<ConnectionInfo, 'pluginName'> {
  return {
    sender: 'browser',
    devServer: window.location.origin.replace(/^https?:\/\//, ''),
  };
}
