import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';

import ExpoLocalAuthentication from '../ExpoLocalAuthentication';
import * as LocalAuthentication from '../LocalAuthentication';

beforeEach(() => {
  ExpoLocalAuthentication.authenticateAsync.mockImplementation(async () => ({}));
});

afterEach(unmockAllProperties);

it(`uses message on iOS`, async () => {
  mockPlatformIOS();

  const message = '<DEBUG_MESSAGE>';
  await LocalAuthentication.authenticateAsync(message);

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenLastCalledWith(message);
});

it(`throws when an invalid message on is used iOS`, async () => {
  mockPlatformIOS();

  expect(LocalAuthentication.authenticateAsync(undefined)).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync('')).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync({} as any)).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync(123 as any)).rejects.toThrow();
});

it(`doesn't use a message on Android`, async () => {
  mockPlatformAndroid();

  const message = '<DEBUG_MESSAGE>';
  await LocalAuthentication.authenticateAsync(message);

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenLastCalledWith();
});
