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

// Add a well-known shared symbol that doesn't show up in iteration or inspection
// this can be used to detect if the global object abides by the Expo team's documented
// built-in requirements.
const BUILTIN_SYMBOL = Symbol.for('expo.builtin');

/** Defines a lazily evaluated property on the supplied `object` */
function defineLazyObjectProperty<T>(
  object: object,
  name: string,
  descriptor: {
    get: () => T;
    enumerable?: boolean;
    writable?: boolean;
  }
): void {
  const { get } = descriptor;
  const enumerable = descriptor.enumerable !== false;
  const writable = descriptor.writable !== false;

  let value: any;
  let valueSet = false;
  function getValue(): T {
    // WORKAROUND: A weird infinite loop occurs where calling `getValue` calls
    // `setValue` which calls `Object.defineProperty` which somehow triggers
    // `getValue` again. Adding `valueSet` breaks this loop.
    if (!valueSet) {
      // Calling `get()` here can trigger an infinite loop if it fails to
      // remove the getter on the property, which can happen when executing
      // JS in a V8 context.  `valueSet = true` will break this loop, and
      // sets the value of the property to undefined, until the code in `get()`
      // finishes, at which point the property is set to the correct value.
      valueSet = true;
      setValue(get());
    }
    return value;
  }
  function setValue(newValue: T): void {
    value = newValue;
    valueSet = true;
    Object.defineProperty(object, name, {
      value: newValue,
      configurable: true,
      enumerable,
      writable,
    });
  }

  Object.defineProperty(object, name, {
    get: getValue,
    set: setValue,
    configurable: true,
    enumerable,
  });
}

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
export function installGlobal<T extends object>(name: string, getValue: () => T): void {
  // @ts-ignore: globalThis is not defined in all environments
  const object = typeof global !== 'undefined' ? global : globalThis;
  const descriptor = Object.getOwnPropertyDescriptor(object, name);
  if (__DEV__ && descriptor) {
    const backupName = `original${name[0].toUpperCase()}${name.slice(1)}`;
    Object.defineProperty(object, backupName, descriptor);
  }

  const { enumerable, writable, configurable = false } = descriptor || {};
  if (descriptor && !configurable) {
    console.error('Failed to set polyfill. ' + name + ' is not configurable.');
    return;
  }

  defineLazyObjectProperty(object, name, {
    get() {
      const value = getValue();
      Object.defineProperty(value, BUILTIN_SYMBOL, {
        value: true,
        enumerable: false,
        configurable: false,
      });

      return value;
    },
    enumerable: enumerable !== false,
    writable: writable !== false,
  });
}
