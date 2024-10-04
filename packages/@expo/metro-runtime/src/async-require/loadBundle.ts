/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { buildUrlForBundle } from './buildUrlForBundle';
import { fetchThenEvalAsync } from './fetchThenEval';

/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param bundlePath Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon.bundle?params=from-metro`.
 */
export async function loadBundleAsync(bundlePath: string): Promise<void> {
  const requestUrl = buildUrlForBundle(bundlePath);

  if (process.env.NODE_ENV === 'production') {
    return fetchThenEvalAsync(requestUrl);
  } else {
    return fetchThenEvalAsync(requestUrl).then(() => {
      const HMRClient = require('../HMRClient').default as typeof import('../HMRClient').default;
      HMRClient.registerBundle(requestUrl);
    });
  }
}
