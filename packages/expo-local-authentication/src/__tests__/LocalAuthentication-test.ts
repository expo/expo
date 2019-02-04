import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';

import ExpoLocalAuthentication from '../ExpoLocalAuthentication';
import * as LocalAuthentication from '../LocalAuthentication';

afterEach(unmockAllProperties);

beforeEach(() => {
  ExpoLocalAuthentication.authenticateAsync.mockImplementation(async () => ({}));
});
it(`uses message on iOS`, async () => {
  mockPlatformIOS();

  const message = '<DEBUG_MESSAGE>';
  await LocalAuthentication.authenticateAsync(message);

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenCalledWith(message);
});

it(`throws when an invalid message on is used iOS`, async () => {
  mockPlatformIOS();

  expect(LocalAuthentication.authenticateAsync(undefined)).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync('')).rejects.toThrow();
});

it(`doesn't use a message on Android`, async () => {
  mockPlatformAndroid();

  const message = '<DEBUG_MESSAGE>';
  await LocalAuthentication.authenticateAsync(message);

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenCalledWith();
});
