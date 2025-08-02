/**
 * Copyright © 2025 650 Industries.
 * Copyright © Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 * Fork of unexposed react-native module
 * https://github.com/facebook/react-native/blob/c5fb371061c1083684a23aa0852f6dbfb74a8b52/packages/react-native/Libraries/Utilities/PolyfillFunctions.js#L1
 */
/**
 * Sets an object's property. If a property with the same name exists, this will
 * replace it but maintain its descriptor configuration. The property will be
 * replaced with a lazy getter.
 *
 * In DEV mode the original property value will be preserved as `original[PropertyName]`
 * so that, if necessary, it can be restored. For example, if you want to route
 * network requests through DevTools (to trace them):
 *
 *   global.XMLHttpRequest = global.originalXMLHttpRequest;
 *
 * @see https://github.com/facebook/react-native/issues/934
 */
export declare function installGlobal<T extends object>(name: string, getValue: () => T): void;
//# sourceMappingURL=installGlobal.d.ts.map