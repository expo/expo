import 'abort-controller/polyfill';

import { DevicePushToken } from '../../Tokens.types';
import { updateDevicePushTokenAsync } from '../updateDevicePushTokenAsync';

const TOKEN: DevicePushToken = { type: 'ios', data: 'i-am-token' };

jest.mock('../../ServerRegistrationModule', () => ({
  getInstallationIdAsync: () => 'abcdefg',
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
