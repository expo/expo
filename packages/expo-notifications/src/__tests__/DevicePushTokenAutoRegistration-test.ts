import * as DevicePushTokenAutoRegistration from '../DevicePushTokenAutoRegistration.fx';
import type { DevicePushToken } from '../Tokens.types';
import { getDevicePushTokenAsync } from '../getDevicePushTokenAsync';
import {
  updateDevicePushTokenAsync,
  hasDeviceTokenChangedAsync,
} from '../utils/updateDevicePushTokenAsync';

const ENABLED_REGISTRATION_FIXTURE: DevicePushTokenAutoRegistration.DevicePushTokenRegistration = {
  isEnabled: true,
};
const DISABLED_REGISTRATION_FIXTURE: DevicePushTokenAutoRegistration.DevicePushTokenRegistration = {
  isEnabled: false,
};

jest.mock('../utils/updateDevicePushTokenAsync');
jest.mock('../ServerRegistrationModule');
jest.mock('../getDevicePushTokenAsync');

const mockedHasDeviceTokenChangedAsync = hasDeviceTokenChangedAsync as jest.MockedFunction<
  typeof hasDeviceTokenChangedAsync
>;

describe('__handlePersistedRegistrationInfoAsync', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Default: assume token has changed so registration proceeds
    mockedHasDeviceTokenChangedAsync.mockResolvedValue(true);
  });

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
    expect(getDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(updateDevicePushTokenAsync).not.toHaveBeenCalled();
  });

  it(`does try to update registration if it's enabled and token has changed`, async () => {
    const mockPendingDevicePushToken: DevicePushToken = {
      data: 'i-want-to-be-sent-to-server',
      type: 'ios',
    };
    (
      getDevicePushTokenAsync as jest.MockedFunction<typeof getDevicePushTokenAsync>
    ).mockResolvedValue(mockPendingDevicePushToken);
    mockedHasDeviceTokenChangedAsync.mockResolvedValue(true);
    await DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(
      JSON.stringify(ENABLED_REGISTRATION_FIXTURE)
    );
    expect(hasDeviceTokenChangedAsync).toHaveBeenCalledWith(mockPendingDevicePushToken);
    expect(updateDevicePushTokenAsync).toHaveBeenCalledWith(
      expect.anything(),
      mockPendingDevicePushToken
    );
  });

  it(`skips registration if enabled but token has not changed`, async () => {
    const mockPendingDevicePushToken: DevicePushToken = {
      data: 'unchanged-token',
      type: 'android',
    };
    (
      getDevicePushTokenAsync as jest.MockedFunction<typeof getDevicePushTokenAsync>
    ).mockResolvedValue(mockPendingDevicePushToken);
    mockedHasDeviceTokenChangedAsync.mockResolvedValue(false);
    await DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(
      JSON.stringify(ENABLED_REGISTRATION_FIXTURE)
    );
    expect(hasDeviceTokenChangedAsync).toHaveBeenCalledWith(mockPendingDevicePushToken);
    expect(updateDevicePushTokenAsync).not.toHaveBeenCalled();
  });

  it(`handles errors during registration gracefully`, async () => {
    const mockPendingDevicePushToken: DevicePushToken = {
      data: 'some-token',
      type: 'ios',
    };
    (
      getDevicePushTokenAsync as jest.MockedFunction<typeof getDevicePushTokenAsync>
    ).mockResolvedValue(mockPendingDevicePushToken);
    // Simulate an unexpected error after getDevicePushTokenAsync succeeds
    mockedHasDeviceTokenChangedAsync.mockRejectedValue(new Error('storage error'));
    const spy = jest.spyOn(console, 'warn').mockImplementation();
    await DevicePushTokenAutoRegistration.__handlePersistedRegistrationInfoAsync(
      JSON.stringify(ENABLED_REGISTRATION_FIXTURE)
    );
    expect(updateDevicePushTokenAsync).not.toHaveBeenCalled();
    spy.mockRestore();
  });
});
