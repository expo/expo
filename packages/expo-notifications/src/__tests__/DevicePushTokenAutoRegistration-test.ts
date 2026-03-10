import * as DevicePushTokenAutoRegistration from '../DevicePushTokenAutoRegistration.fx';
import { DevicePushToken } from '../Tokens.types';
import { getDevicePushTokenAsync } from '../getDevicePushTokenAsync';
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
jest.mock('../TokenEmitter');

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
    expect(getDevicePushTokenAsync).not.toHaveBeenCalled();
    expect(updateDevicePushTokenAsync).not.toHaveBeenCalled();
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
    expect(updateDevicePushTokenAsync).toHaveBeenCalledWith(
      expect.anything(),
      mockPendingDevicePushToken
    );
  });
});

describe('module initialization', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('handles getRegistrationInfoAsync rejection without unhandled rejection', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const keychainError = new Error('Keychain access failed: User interaction is not allowed.');
    const mockGetRegistrationInfo = jest.fn().mockRejectedValue(keychainError);

    jest.resetModules();
    jest.doMock('../ServerRegistrationModule', () => ({
      __esModule: true,
      default: {
        getRegistrationInfoAsync: mockGetRegistrationInfo,
      },
    }));
    jest.doMock('../TokenEmitter', () => ({
      addPushTokenListener: jest.fn(),
    }));

    require('../DevicePushTokenAutoRegistration.fx');

    // Await the rejected promise returned by the mock so the .then()
    // rejection handler can execute.
    await mockGetRegistrationInfo.mock.results[0].value.catch(() => {});
    // One more tick for the chained .then handler to run.
    await new Promise((resolve) => setTimeout(resolve, 0));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('fetching persisted server registration info'),
      expect.any(Error)
    );
  });
});
