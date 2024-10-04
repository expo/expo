import { mockProperty, unmockAllProperties } from 'jest-expo';

afterEach(() => {
  unmockAllProperties();
  jest.resetModules();
});

it(`passes if we're running in Expo`, () => {
  const Constants = require('expo-constants').default;
  expect(Constants.expoVersion).toBeDefined();
  expect(() => require('../validate.fx')).not.toThrow();
});

it(`throws if we're not running in Expo`, () => {
  const Constants = require('expo-constants').default;
  mockProperty(Constants, 'expoVersion', undefined);
  expect(() => require('../validate.fx')).toThrowError('Expo');
});

it(`doesn't throw an error if we're not running in Expo and have disabled the error`, () => {
  require('../validatorState')._setShouldThrowAnErrorOutsideOfExpo(false);
  expect(require('../validatorState').shouldThrowAnErrorOutsideOfExpo()).toBeFalsy();
  const Constants = require('expo-constants').default;
  mockProperty(Constants, 'expoVersion', undefined);
  expect(() => require('../validate.fx')).not.toThrowError();
});
