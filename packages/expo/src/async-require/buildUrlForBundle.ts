/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

/**
 * Given a path and some optional additional query parameters, create the dev server bundle URL.
 * @param bundlePath like `/foobar`
 * @param params like `{ platform: "web" }`
 * @returns a URL like "/foobar.bundle?platform=android&modulesOnly=true&runModule=false&runtimeBytecodeVersion=null"
 */
export function buildUrlForBundle(bundlePath: string): string {
  if (bundlePath.match(/^https?:\/\//)) {
    return bundlePath;
  }

  if (
    typeof window !== 'undefined' &&
    // @ts-expect-error
    typeof window.ReactNativeWebView !== 'undefined'
  ) {
    // In a webview, you cannot read from an absolute path.
    return bundlePath;
  }
  // NOTE(EvanBacon): This must come from the window origin (at least in dev mode).
  // Otherwise Metro will crash from attempting to load a bundle that doesn't exist.
  return '/' + bundlePath.replace(/^\/+/, '');
}
