import { EventEmitter } from 'fbemitter';
import { Linking } from 'react-native';

const allOriginalPropertyDescriptors = new Map();

export function mockProperty(object, property, mockValue) {
  // Save a reference to the original property descriptor
  if (!allOriginalPropertyDescriptors.has(object)) {
    allOriginalPropertyDescriptors.set(object, new Map());
  }
  let descriptor = Object.getOwnPropertyDescriptor(object, property);
  allOriginalPropertyDescriptors.get(object).set(property, descriptor);

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

export function unmockProperty(object, property) {
  const descriptors = allOriginalPropertyDescriptors.get(object);
  if (!descriptors || !descriptors.has(property)) {
    return;
  }

  const descriptor = descriptors.get(property);
  if (descriptor) {
    Object.defineProperty(object, property, descriptor);
  } else {
    delete object[property];
  }

  // Clean up the reference
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
        delete object[property];
      }
    }
  }
  allOriginalPropertyDescriptors.clear();
}

export function mockLinking() {
  const emitter = new EventEmitter();
  const subscriptions = {};

  mockProperty(
    Linking,
    'addEventListener',
    jest.fn((type, cb) => {
      const subscription = emitter.addListener(type, cb);
      subscriptions[type] = subscriptions[type] || new Map();
      subscriptions[type].set(cb, subscription);
    })
  );

  mockProperty(
    Linking,
    'removeEventListener',
    jest.fn((type, cb) => {
      subscriptions[type].delete(cb);
    })
  );

  return (type, data) => {
    emitter.emit(type, data);
  };
}
