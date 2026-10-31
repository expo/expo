/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import { ctx as rootContext } from 'expo-router/_ctx-html';

export function getRootComponent() {
  const keys = rootContext.keys();
  if (!keys.length) {
    return (require('./html') as typeof import('./html')).Html;
  }
  if (keys.length > 1) {
    throw new Error(`Multiple components match the root HTML element: ${keys.join(', ')}`);
  }
  const exp = rootContext(keys[0]!);

  if (!exp.default) {
    throw new Error(`The root HTML element "${keys[0]}" is missing the required default export.`);
  }

  return exp.default;
}

/** The `+html` module key, or the name of the default document, for messages. */
export function getRootComponentSource(): string {
  return rootContext.keys()[0] ?? 'expo-router/html (default)';
}
