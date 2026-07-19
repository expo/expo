/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import getDevServer from './getDevServer';

/**
 * Given a path and some optional additional query parameters, create the dev server bundle URL.
 * @param bundlePath like `/foobar`
 * @param params like `{ platform: "web" }`
 * @returns a URL like "/foobar.bundle?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null"
 */
export function buildUrlForBundle(bundlePath: string): string {
  if (/^https?:\/\//.test(bundlePath)) {
    return bundlePath;
  }
  const { url: baseURL } = getDevServer();
  return baseURL ? new URL(bundlePath, baseURL).toString() : `//${bundlePath.replace(/^\/+/, '')}`;
}
