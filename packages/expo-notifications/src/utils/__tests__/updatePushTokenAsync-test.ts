import { mocked } from 'ts-jest/utils';

import ServerRegistrationModule from '../../ServerRegistrationModule';
import { DevicePushToken } from '../../Tokens.types';
import { interruptPushTokenUpdates, updatePushTokenAsync } from '../updatePushTokenAsync';

const TOKEN: DevicePushToken = { type: 'ios', data: 'i-am-token' };

jest.mock('../../ServerRegistrationModule');

declare const global: any;

describe('given empty last registration info', () => {
  beforeAll(() => {
    mocked(ServerRegistrationModule.getLastRegistrationInfoAsync!).mockResolvedValue(null);
  });

  it(`doesn't throw`, async () => {
    await expect(updatePushTokenAsync(TOKEN)).resolves.toBeUndefined();
  });
});

describe('given invalid last registration info', () => {
  beforeAll(() => {
    mocked(ServerRegistrationModule.getLastRegistrationInfoAsync!).mockResolvedValue(
      '{i-am-invalid-json'
    );
  });

  it(`does throw`, async () => {
    await expect(updatePushTokenAsync(TOKEN)).rejects.toBeDefined();
  });
});

describe('given valid last registration info', () => {
  const mockUrl = 'https://example.com/';
  const mockBody = {
    customArgument: '@tester',
  };

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

    mocked(ServerRegistrationModule.getLastRegistrationInfoAsync!).mockResolvedValue(
      JSON.stringify({
        url: mockUrl,
        body: mockBody,
      })
    );
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('submits the request with custom body to proper URL', async () => {
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    try {
      await updatePushTokenAsync(TOKEN);
    } catch (e) {}
    warnSpy.mockRestore();
    expect(global.fetch).toHaveBeenCalledWith(
      mockUrl,
      expect.objectContaining({
        body:
          '{"customArgument":"@tester","development":false,"deviceToken":"i-am-token","type":"apns"}',
      })
    );
  });

  it('ensures that if registration is killed while sending the request, the pending token is persisted for future resume', async () => {
    global.fetch.mockImplementation(async () => {
      interruptPushTokenUpdates();
      return successResponse;
    });
    await updatePushTokenAsync(TOKEN);

    expect(
      JSON.parse(
        mocked(ServerRegistrationModule.setLastRegistrationInfoAsync!).mock.calls[
          mocked(ServerRegistrationModule.setLastRegistrationInfoAsync!).mock.calls.length - 1
        ][0]!
      )
    ).toEqual(expect.objectContaining({ pendingDevicePushToken: TOKEN }));
  });

  describe('when server responds with an ok status', () => {
    beforeAll(() => {
      global.fetch.mockResolvedValue(successResponse);
    });

    it('submits the request only once', async () => {
      await updatePushTokenAsync(TOKEN);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('ensures that if registration succeeds, the pending token is cleared', async () => {
      await updatePushTokenAsync(TOKEN);
      expect(
        JSON.parse(
          mocked(ServerRegistrationModule.setLastRegistrationInfoAsync!).mock.calls[
            mocked(ServerRegistrationModule.setLastRegistrationInfoAsync!).mock.calls.length - 1
          ][0]!
        )
      ).toEqual(expect.objectContaining({ pendingDevicePushToken: null }));
    });
  });

  it('retries until it succeeds whilst server responds with an error status', async () => {
    const spy = jest.spyOn(console, 'debug').mockImplementation();
    global.fetch
      .mockResolvedValueOnce(failureResponse)
      .mockResolvedValueOnce(failureResponse)
      .mockResolvedValueOnce(successResponse);
    await updatePushTokenAsync(TOKEN);
    expect(global.fetch).toHaveBeenCalledTimes(3);
    spy.mockRestore();
  });

  it('retries until it succeeds if fetch throws', async () => {
    const debugSpy = jest.spyOn(console, 'debug').mockImplementation();
    const warnSpy = jest.spyOn(console, 'warn').mockImplementation();
    global.fetch.mockRejectedValueOnce(new TypeError()).mockResolvedValueOnce(successResponse);
    await updatePushTokenAsync(TOKEN);
    expect(global.fetch).toHaveBeenCalledTimes(2);
    warnSpy.mockRestore();
    debugSpy.mockRestore();
  });
});
