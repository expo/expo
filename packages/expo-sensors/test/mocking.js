import { Platform } from 'react-native';

export function mockProperty(object, property, mockValue) {
  let descriptor = Object.getOwnPropertyDescriptor(object, property);

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

export function mockPlatformIOS() {
  mockProperty(Platform, 'OS', 'ios');
}

export function mockPlatformAndroid() {
  mockProperty(Platform, 'OS', 'android');
}
