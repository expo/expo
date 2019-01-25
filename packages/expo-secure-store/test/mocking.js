import { Platform } from 'react-native';

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
    let { configurable, enumerable, writable } = descriptor;
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
  let descriptors = allOriginalPropertyDescriptors.get(object);
  if (!descriptors || !descriptors.has(property)) {
    return;
  }

  let descriptor = descriptors.get(property);
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
  for (let [object, descriptors] of allOriginalPropertyDescriptors) {
    for (let [property, descriptor] of descriptors) {
      if (descriptor) {
        Object.defineProperty(object, property, descriptor);
      } else {
        delete object[property];
      }
    }
  }
  allOriginalPropertyDescriptors.clear();
}

export function mockPlatformIOS() {
  mockProperty(Platform, 'OS', 'ios');
}
