// NOTE(cedric): `react-native/Libraries/Core/setUpDeveloperTools.js` warns and disables terminal logging.
// Expo wants to keep terminal logs available, and overwrites the `__FUSEBOX_HAS_FULL_CONSOLE_SUPPORT__` check.
// When the inspector proxy allows multiple debugger connections, and Expo receives the "inspectable device is avaible" event
// we want to remove this override, and create a CLI-only system that uses CDP to emit logs to the terminal.

/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * @flow strict-local
 * @format
 */

import Platform from 'react-native/Libraries/Utilities/Platform';

declare var console: {[string]: $FlowFixMe};

/**
 * Sets up developer tools for React Native.
 * You can use this module directly, or just require InitializeCore.
 */
if (__DEV__) {
  require('react-native/Libraries/Core/setUpReactDevTools');

  // Set up inspector
  const JSInspector = require('react-native/Libraries/JSInspector/JSInspector');
  JSInspector.registerAgent(require('react-native/Libraries/JSInspector/NetworkAgent'));

  // Note we can't check if console is "native" because it would appear "native" in JSC and Hermes.
  // We also can't check any properties that don't exist in the Chrome worker environment.
  // So we check a navigator property that's set to a particular value ("Netscape") in all real browsers.
  const isLikelyARealBrowser =
    global.navigator != null &&
    /*              _
     *             | |
     *   _ __   ___| |_ ___  ___ __ _ _ __   ___
     *  | '_ \ / _ \ __/ __|/ __/ _` | '_ \ / _ \
     *  | | | |  __/ |_\__ \ (_| (_| | |_) |  __/
     *  |_| |_|\___|\__|___/\___\__,_| .__/ \___|
     *                               | |
     *                               |_|
     */
    global.navigator.appName === 'Netscape'; // Any real browser

  if (true || !Platform.isTesting) {
    const HMRClient = require('react-native/Libraries/Utilities/HMRClient');

    // NOTE(cedric): we both disable the Fusebox check and notification emitted by `notifyFuseboxConsoleEnabled`
    // if (global.__FUSEBOX_HAS_FULL_CONSOLE_SUPPORT__) {
    //   HMRClient.unstable_notifyFuseboxConsoleEnabled();
    // } else 
    
    if (console._isPolyfilled) {
      // We assume full control over the console and send JavaScript logs to Metro.
      [
        'trace',
        'info',
        'warn',
        'error',
        'log',
        'group',
        'groupCollapsed',
        'groupEnd',
        'debug',
      ].forEach(level => {
        const originalFunction = console[level];
        console[level] = function (...args: $ReadOnlyArray<mixed>) {
          HMRClient.log(level, args);
          originalFunction.apply(console, args);
        };
      });
    } else {
      // We assume the environment has a real rich console (like Chrome), and don't hijack it to log to Metro.
      // It's likely the developer is using rich console to debug anyway, and hijacking it would
      // lose the filenames in console.log calls: https://github.com/facebook/react-native/issues/26788.
      HMRClient.log('log', [
        `JavaScript logs will appear in your ${
          isLikelyARealBrowser ? 'browser' : 'environment'
        } nsole`,
      ]);
    }
  }

  require('react-native/Libraries/Core/setUpReactRefresh');

  global[
    `${global.__METRO_GLOBAL_PREFIX__ ?? ''}__loadBundleAsync`
  ] = require('react-native/Libraries/Core/Devtools/loadBundleFromServer');
}
