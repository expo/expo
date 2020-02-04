import ExpoLocalAuthentication from '../ExpoLocalAuthentication';
import * as LocalAuthentication from '../LocalAuthentication';

beforeEach(() => {
  ExpoLocalAuthentication.authenticateAsync.mockReset();
  ExpoLocalAuthentication.authenticateAsync.mockImplementation(async () => ({ success: true }));
});

it(`uses options on iOS`, async () => {
  const options = {
    promptMessage: 'Authentication is required',
    cancelLabel: 'Abort',
    fallbackLabel: 'Use passcode',
    disableDeviceFallback: false,
  };
  await LocalAuthentication.authenticateAsync(options);

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenLastCalledWith(options);
});

it(`throws when an invalid message is used on iOS`, async () => {
  expect(
    LocalAuthentication.authenticateAsync({ promptMessage: undefined as any })
  ).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync({ promptMessage: '' })).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync({ promptMessage: {} as any })).rejects.toThrow();
  expect(LocalAuthentication.authenticateAsync({ promptMessage: 123 as any })).rejects.toThrow();
});
