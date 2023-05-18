/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import qs from 'qs';

import getDevServer from '../getDevServer';

export function buildUrlForBundle(
  bundlePath: string,
  params: Record<string, string | null> = {}
): string {
  const { fullBundleUrl, url: serverUrl, bundleLoadedFromServer } = getDevServer();
  if (!bundleLoadedFromServer) {
    throw new Error(
      "This bundle was compiled with 'transformer.experimentalImportBundleSupport' in the 'metro.config.js' and can only be used when connected to a Metro server."
    );
  }
  let query = {};
  if (fullBundleUrl != null) {
    const queryStart = fullBundleUrl.indexOf('?');
    if (queryStart !== -1) {
      query = qs.parse(fullBundleUrl.substring(queryStart + 1));
    }
  }
  Object.assign(query, params);
  return serverUrl + bundlePath + '.bundle?' + qs.stringify(query);
}
