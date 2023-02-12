import * as DevicePushTokenAutoRegistration from '../DevicePushTokenAutoRegistration.fx';
import { DevicePushToken } from '../Tokens.types';
import getDevicePushTokenAsync from '../getDevicePushTokenAsync';
import { updateDevicePushTokenAsync } from '../utils/updateDevicePushTokenAsync';

const ENABLED_REGISTRATION_FIXTURE: DevicePushTokenAutoRegistration.DevicePushTokenRegistration = {
  isEnabled: true,
};
const DISABLED_REGISTRATION_FIXTURE: DevicePushTokenAutoRegistration.DevicePushTokenRegistration = {
  isEnabled: false,
};

jest.mock('../utils/updateDevicePushTokenAsync');
jest.mock('../ServerRegistrationModule');
jest.mock('../getDevicePushTokenAsync');

describe('__handlePersistedRegistrationInfoAsync', () => {
  it(`doesn't fail if persisted value is empty`, async () => {
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    await expect(
      DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(null)
    ).resolves.toBeUndefined();
    await expect(
      DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(undefined)
    ).resolves.toBeUndefined();
    await expect(
      DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync('{i-am-invalid-json')
    ).resolves.toBeUndefined();
    spy.mockRestore();
  });

  it(`doesn't try to update registration if it's not enabled`, async () => {
    await DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(
      JSON.stringify(DISABLED_REGISTRATION_FIXTURE)
    );
    expect(getDevicePushTokenAsync).not.toBeCalled();
    expect(updateDevicePushTokenAsync).not.toBeCalled();
  });

  it(`does try to update registration if it's enabled`, async () => {
    const mockPendingDevicePushToken: DevicePushToken = {
      data: 'i-want-to-be-sent-to-server',
      type: 'ios',
    };
    (
      getDevicePushTokenAsync as jest.MockedFunction<typeof getDevicePushTokenAsync>
    ).mockResolvedValue(mockPendingDevicePushToken);
    await DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(
      JSON.stringify(ENABLED_REGISTRATION_FIXTURE)
    );
    expect(updateDevicePushTokenAsync).toBeCalledWith(
      expect.anything(),
      mockPendingDevicePushToken
    );
  });
});
