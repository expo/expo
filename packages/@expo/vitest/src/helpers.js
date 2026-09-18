// @ts-check
/**
 * Test helpers, ported from `jest-expo/src/index.js`.
 *
 * Import from `@expo/vitest/helpers` inside test files only: this module imports `react-native`.
 */
import { Linking } from 'react-native';
import { vi } from 'vitest';

/** @type {Map<object, Map<PropertyKey, PropertyDescriptor | undefined>>} */
const allOriginalPropertyDescriptors = new Map();

/**
 * Replace `object[property]` with `mockValue`, remembering the original descriptor so
 * `unmockProperty`/`unmockAllProperties` can restore it.
 *
 * @param {object} object
 * @param {PropertyKey} property
 * @param {unknown} mockValue
 */
export function mockProperty(object, property, mockValue) {
  let descriptors = allOriginalPropertyDescriptors.get(object);
  if (!descriptors) {
    descriptors = new Map();
    allOriginalPropertyDescriptors.set(object, descriptors);
  }
  let descriptor = Object.getOwnPropertyDescriptor(object, property);
  descriptors.set(property, descriptor);

  // Select fields to inherit from the original descriptor
  if (descriptor) {
    const { configurable, enumerable, writable } = descriptor;
    descriptor = { configurable, enumerable, writable };
  }

  Object.defineProperty(object, property, {
    configurable: true,
    enumerable: true,
    writable: true,
    ...descriptor,
    value: mockValue,
  });
}

/**
 * @param {object} object
 * @param {PropertyKey} property
 */
export function unmockProperty(object, property) {
  const descriptors = allOriginalPropertyDescriptors.get(object);
  if (!descriptors || !descriptors.has(property)) {
    return;
  }

  const descriptor = descriptors.get(property);
  if (descriptor) {
    Object.defineProperty(object, property, descriptor);
  } else {
    delete (/** @type {any} */ (object)[property]);
  }

  descriptors.delete(property);
  if (!descriptors.size) {
    allOriginalPropertyDescriptors.delete(object);
  }
}

export function unmockAllProperties() {
  for (const [object, descriptors] of allOriginalPropertyDescriptors) {
    for (const [property, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(object, property, descriptor);
      } else {
        delete (/** @type {any} */ (object)[property]);
      }
    }
  }
  allOriginalPropertyDescriptors.clear();
}

/**
 * Mock `Linking.addEventListener`/`removeEventListener` and return an emitter for tests.
 * @returns {(type: string, data: unknown) => void}
 */
export function mockLinking() {
  /** @type {Record<string, Set<(data: unknown) => void>>} */
  const listeners = Object.create(null);

  mockProperty(
    Linking,
    'addEventListener',
    vi.fn((type, cb) => {
      const listenersForType = listeners[type] || (listeners[type] = new Set());
      listenersForType.add(cb);
      return { remove: () => listenersForType.delete(cb) };
    })
  );

  mockProperty(
    Linking,
    'removeEventListener',
    vi.fn((type, cb) => {
      listeners[type]?.delete(cb);
    })
  );

  return (type, data) => {
    listeners[type]?.forEach((listener) => listener(data));
  };
}
