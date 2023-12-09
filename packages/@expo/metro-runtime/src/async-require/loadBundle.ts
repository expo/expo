/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { buildUrlForBundle } from './buildUrlForBundle';
import { fetchThenEvalAsync } from './fetchThenEval';

let pendingRequests = 0;

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
    const Platform = require('react-native').Platform;
    const LoadingView = require('../LoadingView')
      .default as typeof import('../LoadingView').default;
    if (Platform.OS !== 'web') {
      // Send a signal to the `expo` package to show the loading indicator.
      LoadingView.showMessage('Downloading...', 'load');
    }
    pendingRequests++;

    return fetchThenEvalAsync(requestUrl)
      .then(() => {
        const HMRClient = require('../HMRClient').default as typeof import('../HMRClient').default;
        HMRClient.registerBundle(requestUrl);
      })
      .finally(() => {
        if (!--pendingRequests && Platform.OS !== 'web') {
          LoadingView.hide();
        }
      });
  }
}
