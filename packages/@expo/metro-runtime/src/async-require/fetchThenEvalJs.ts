/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { fetchAsync } from './fetchAsync';

declare let global: {
  globalEvalWithSourceUrl?: any;
};

/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param bundlePath Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon`.
 */
export function fetchThenEvalAsync(url: string): Promise<void> {
  return fetchAsync(url).then(({ body, status, headers }) => {
    if (
      headers?.has?.('Content-Type') != null &&
      headers.get('Content-Type')!.includes('application/json')
    ) {
      // Errors are returned as JSON.
      throw new Error(JSON.parse(body).message || `Unknown error fetching '${url}'`);
    }

    if (status === 200) {
      // Some engines do not support `sourceURL` as a comment. We expose a
      // `globalEvalWithSourceUrl` function to handle updates in that case.
      if (global.globalEvalWithSourceUrl) {
        return global.globalEvalWithSourceUrl(body, url);
      } else {
        // eslint-disable-next-line no-eval
        return eval(body);
      }
    } else {
      // Format Metro errors if possible.
      if (process.env.NODE_ENV === 'development') {
        // body can be an error from Metro if a module is missing.
        // {"originModulePath":"/Users/evanbacon/Documents/GitHub/expo/.","targetModuleName":"./http://localhost:8081/node_modules/react-native/index.js","message":"..."}
        const error = jsonParseOptional(body);
        if (error) {
          // TODO: This is essentially like the Metro native red box errors. We should do a better job formatting them so
          // the user experience doesn't feel bad. This can be tested by loading a split bundle that results in a missing module error from Metro.
          if ('message' in error) {
            throw new Error(
              'Failed to load split bundle from Metro ' +
                url +
                ' (check terminal for more info).\n(load: ' +
                error.message +
                ')'
            );
          }
        }
      }

      throw new Error(
        `Failed to load split bundle from Metro ${url} (check terminal for more info).\n${body}`
      );
    }
  });
}

function jsonParseOptional(json: string): any {
  try {
    return JSON.parse(json);
  } catch {
    return null;
  }
}
