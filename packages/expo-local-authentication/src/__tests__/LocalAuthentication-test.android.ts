import ExpoLocalAuthentication from '../ExpoLocalAuthentication';
import * as LocalAuthentication from '../LocalAuthentication';

beforeEach(() => {
  ExpoLocalAuthentication.authenticateAsync.mockReset();
  ExpoLocalAuthentication.authenticateAsync.mockImplementation(async () => ({ success: true }));
});

it(`doesn't use a message on Android`, async () => {
  await LocalAuthentication.authenticateAsync({
    promptMessage: 'Authentication is required',
  });

  expect(ExpoLocalAuthentication.authenticateAsync).toHaveBeenLastCalledWith();
});
