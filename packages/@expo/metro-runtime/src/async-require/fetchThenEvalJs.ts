/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
import { MetroServerError } from './errors';
import { fetchAsync } from './fetchAsync';
/**
 * Load a bundle for a URL using fetch + eval on native and script tag injection on web.
 *
 * @param url Given a statement like `import('./Bacon')` `bundlePath` would be `Bacon`.
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
      // eslint-disable-next-line no-eval
      return eval(body);
    } else {
      // Format Metro errors if possible.
      if (process.env.NODE_ENV === 'development') {
        // body can be an error from Metro if a module is missing.
        // {"originModulePath":"/Users/evanbacon/Documents/GitHub/expo/.","targetModuleName":"./http://localhost:8081/node_modules/react-native/index.js","message":"..."}
        const error = jsonParseOptional(body);
        if (error) {
          // TODO: This is essentially like the Metro native red box errors. We should do a better job formatting them so
          // the user experience doesn't feel bad. This can be tested by loading a split bundle that results in a missing module error from Metro.
          throw new MetroServerError(error, url);
        }
      }

      throw new Error(`Failed to load split bundle from URL: ${url}\n${body}`);
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
