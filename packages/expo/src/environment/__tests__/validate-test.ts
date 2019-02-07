import { mockProperty, unmockAllProperties } from 'jest-expo';

const createMockInitializeCore = jest.fn(() => jest.fn());
jest.doMock('react-native/Libraries/Core/InitializeCore', createMockInitializeCore);

afterEach(() => {
  unmockAllProperties();
  jest.resetModules();
});

it(`initializes React Native`, () => {
  expect(createMockInitializeCore).not.toHaveBeenCalled();
  require('../validate');
  expect(createMockInitializeCore).toHaveBeenCalled();
});

it(`passes if we're running in Expo`, () => {
  const Constants = require('expo-constants').default;
  expect(Constants.expoVersion).toBeDefined();
  expect(() => require('../validate')).not.toThrow();
});

it(`throws if we're not running in Expo`, () => {
  const Constants = require('expo-constants').default;
  mockProperty(Constants, 'expoVersion', undefined);
  expect(() => require('../validate')).toThrowError('Expo');
});

it(`doesn't throw an error if we're not running in Expo and have disabled the error`, () => {
  require('../validatorState')._setShouldThrowAnErrorOutsideOfExpo(false);
  expect(require('../validatorState').shouldThrowAnErrorOutsideOfExpo()).toBeFalsy();
  const Constants = require('expo-constants').default;
  mockProperty(Constants, 'expoVersion', undefined);
  expect(() => require('../validate')).not.toThrowError();
});
