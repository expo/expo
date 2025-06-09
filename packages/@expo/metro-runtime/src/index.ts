/**
 * Copyright © 2023 650 Industries.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

import './location/install';

import '@expo/metro-runtime/rsc/runtime';

if (__DEV__) {
  // @ts-expect-error: TODO: Remove this when we remove the log box.
  globalThis.__expo_dev_resetErrors = require('./error-overlay/LogBox').default.clearAllLogs;
}
