import 'abort-controller/polyfill';

import * as Application from 'expo-application';

import ServerRegistrationModule from '../../ServerRegistrationModule';
import type { DevicePushToken } from '../../Tokens.types';
import {
  updateDevicePushTokenAsync,
  hasDeviceTokenChangedAsync,
} from '../updateDevicePushTokenAsync';

const TOKEN: DevicePushToken = { type: 'ios', data: 'i-am-token' };

jest.mock('../../ServerRegistrationModule', () => ({
  getInstallationIdAsync: () => 'abcdefg',
  getRegistrationInfoAsync: jest.fn(),
  setRegistrationInfoAsync: jest.fn(),
}));

declare const global: any;

const expoEndpointUrl = 'https://exp.host/--/api/v2/push/updateDeviceToken';

describe('given valid registration info', () => {
  const successResponse = {
    status: 200,
    ok: true,
  } as Response;

  const failureResponse = {
    status: 500,
    ok: false,
    text: async () => 'Server error',
  } as Response;

  let originalFetch: typeof fetch | undefined;

  beforeAll(() => {
    originalFetch = global.fetch;
    global.fetch = jest.fn();
  });

  beforeEach(() => {
    global.fetch.mockClear();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('submits the request to proper URL', async () => {
    global.fetch.mockResolvedValue(successResponse);
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    const abortController = new AbortController();
    await updateDevicePushTokenAsync(abortController.signal, TOKEN);
    warnSpy.mockRestore();
    expect(global.fetch).toHaveBeenCalledWith(expoEndpointUrl, expect.anything());
  });

  describe('when server responds with an ok status', () => {
    beforeAll(() => {
      global.fetch.mockResolvedValue(successResponse);
    });

    it('submits the request only once', async () => {
      const abortController = new AbortController();
      await updateDevicePushTokenAsync(abortController.signal, TOKEN);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });
  });

  it('retries until it succeeds whilst server responds with an error status', async () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation();
    global.fetch
      .mockResolvedValueOnce(failureResponse)
      .mockResolvedValueOnce(failureResponse)
      .mockResolvedValueOnce(successResponse);
    const abortController = new AbortController();
    await updateDevicePushTokenAsync(abortController.signal, TOKEN);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });

  it('retries until it succeeds if fetch throws', async () => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    global.fetch.mockRejectedValueOnce(new TypeError()).mockResolvedValueOnce(successResponse);
    const abortController = new AbortController();
    await updateDevicePushTokenAsync(abortController.signal, TOKEN);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
    debugSpy.mockRestore();
  });

  it('does not retry if signal has been aborted', async () => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    global.fetch.mockRejectedValue(new TypeError());
    const abortController = new AbortController();
    setTimeout(() => abortController.abort(), 1000);
    await updateDevicePushTokenAsync(abortController.signal, TOKEN);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
    debugSpy.mockRestore();
  });
});

describe('hasDeviceTokenChangedAsync', () => {
  const mockedGetRegistrationInfoAsync =
    ServerRegistrationModule.getRegistrationInfoAsync as jest.MockedFunction<
      NonNullable<typeof ServerRegistrationModule.getRegistrationInfoAsync>
    >;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('returns true when no stored data exists', async () => {
    mockedGetRegistrationInfoAsync.mockResolvedValue(null);
    expect(await hasDeviceTokenChangedAsync(TOKEN)).toBe(true);
  });

  it('returns true when stored data has no lastRegisteredDeviceToken key', async () => {
    mockedGetRegistrationInfoAsync.mockResolvedValue(JSON.stringify({ isEnabled: true }));
    expect(await hasDeviceTokenChangedAsync(TOKEN)).toBe(true);
  });

  it('returns false when all fields match and TTL is valid', async () => {
    mockedGetRegistrationInfoAsync.mockResolvedValue(
      JSON.stringify({
        lastRegisteredDeviceToken: {
          deviceToken: TOKEN.data,
          appId: Application.applicationId,
          development: false,
          type: 'apns',
          registeredAt: Date.now(),
        },
      })
    );
    expect(await hasDeviceTokenChangedAsync(TOKEN)).toBe(false);
  });

  it('returns true when deviceToken differs', async () => {
    mockedGetRegistrationInfoAsync.mockResolvedValue(
      JSON.stringify({
        lastRegisteredDeviceToken: {
          deviceToken: 'different-token',
          appId: Application.applicationId,
          development: false,
          type: 'apns',
          registeredAt: Date.now(),
        },
      })
    );
    expect(await hasDeviceTokenChangedAsync(TOKEN)).toBe(true);
  });

  it('returns true when TTL has expired', async () => {
    const eightDaysAgo = Date.now() - 8 * 24 * 60 * 60 * 1000;
    mockedGetRegistrationInfoAsync.mockResolvedValue(
      JSON.stringify({
        lastRegisteredDeviceToken: {
          deviceToken: TOKEN.data,
          appId: Application.applicationId,
          development: false,
          type: 'apns',
          registeredAt: eightDaysAgo,
        },
      })
    );
    expect(await hasDeviceTokenChangedAsync(TOKEN)).toBe(true);
  });

  it('returns true when registeredAt is in the future (clock skew)', async () => {
    const oneHourInFuture = Date.now() + 60 * 60 * 1000;
    mockedGetRegistrationInfoAsync.mockResolvedValue(
      JSON.stringify({
        lastRegisteredDeviceToken: {
          deviceToken: TOKEN.data,
          appId: Application.applicationId,
          development: false,
          type: 'apns',
          registeredAt: oneHourInFuture,
        },
      })
    );
    expect(await hasDeviceTokenChangedAsync(TOKEN)).toBe(true);
  });

  it('returns true when storage throws (fail-open)', async () => {
    mockedGetRegistrationInfoAsync.mockRejectedValue(new Error('keychain error'));
    expect(await hasDeviceTokenChangedAsync(TOKEN)).toBe(true);
  });
});
