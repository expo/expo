/**
 * Copyright © 2022 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @ts-expect-error
import NativeDevSplitBundleLoader from 'react-native/Libraries/Utilities/NativeDevSplitBundleLoader';

import { loadBundleAsync as loadBundlePolyfillAsync } from './loadBundlePolyfill';

export function loadBundleAsync(bundlePath: string): Promise<any> {
  if (
    // NOTE(EvanBacon): This is broken on iOS afaict
    NativeDevSplitBundleLoader?.loadBundle
  ) {
    return NativeDevSplitBundleLoader.loadBundle(bundlePath).catch((e: Error) => {
      // On Android 'e' is not an instance of Error, which seems to be a bug.
      // As a workaround, re-throw an Error to not break the error handling code.
      throw new Error(e.message);
    });
  }
  return loadBundlePolyfillAsync(bundlePath);
}
