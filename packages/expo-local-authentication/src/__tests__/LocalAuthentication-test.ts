import { mockPlatformAndroid, mockPlatformIOS, unmockAllProperties } from 'jest-expo';

import ExpoLocalAuthentication from '../ExpoLocalAuthentication';
import * as LocalAuthentication from '../LocalAuthentication';

beforeEach(() => {
  ExpoLocalAuthentication.authenticateAsync.mockImplementation(async () => ({}));
});

afterEach(unmockAllProperties);

it(`uses promptMessage and fallbackLabel on iOS`, async () => {
  mockPlatformIOS();

  const options = {
    promptMessage: 'Authentication is required',
    fallbackLabel: 'Use passcode',
  };
  await LocalAuthentication.authenticateAsync(options);

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenLastCalledWith(options);
});

it(`throws when an invalid message is used on iOS`, async () => {
  mockPlatformIOS();

  expect(LocalAuthentication.authenticateAsync(undefined)).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync('' as any)).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync({} as any)).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync(123 as any)).rejects.toThrow();
});

it(`doesn't use a message on Android`, async () => {
  mockPlatformAndroid();

  await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authentication is required',
  });

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenLastCalledWith();
});
