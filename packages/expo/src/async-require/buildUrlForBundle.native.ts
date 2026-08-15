/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getDevServer from '../utils/getDevServer';

export function buildUrlForBundle(bundlePath: string): string {
  if (bundlePath.match(/^https?:\/\//)) {
    return bundlePath;
  }

  if (typeof location !== 'undefined') {
    return joinComponents(location.origin, bundlePath);
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Unable to determine the production URL where additional JavaScript chunks are hosted because the global "location" variable is not defined.'
    );
  } else {
    const { url: serverUrl } = getDevServer();

    return joinComponents(serverUrl, bundlePath);
  }
}

function joinComponents(prefix: string, suffix: string): string {
  return prefix.replace(/\/+$/, '') + '/' + suffix.replace(/^\/+/, '');
}
