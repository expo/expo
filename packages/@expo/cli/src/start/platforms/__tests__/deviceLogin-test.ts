import nock from 'nock';

import { getExpoApiBaseUrl } from '../../../api/endpoint';
import { withDeviceLoginParamsAsync } from '../deviceLogin';

jest.mock('../../../api/user/UserSettings', () => ({
  ...jest.requireActual('../../../api/user/UserSettings'),
  getAccessToken: () => null,
  getSession: () => ({ sessionSecret: 'test-session-secret' }),
}));

const url = 'my-app://?__expo_url=http%3A%2F%2Flocalhost%3A8081';

beforeEach(() => {
  process.env.EXPO_UNSTABLE_DEV_CLIENT_LOGIN = '1';
});

afterEach(() => {
  delete process.env.EXPO_UNSTABLE_DEV_CLIENT_LOGIN;
  nock.cleanAll();
});

describe(withDeviceLoginParamsAsync, () => {
  it('adds the params of a device code that the session approved', async () => {
    const scope = nock(getExpoApiBaseUrl(), {
      reqheaders: { 'expo-session': 'test-session-secret' },
    })
      .post('/v2/auth/device_authorization', { client_id: 'expo-go', device_name: /.+/ })
      .reply(200, { data: { device_code: 'code', user_code: 'ABCD-EFGH' } })
      .post('/v2/auth/device-verifications/lookup', { user_code: 'ABCD-EFGH' })
      .reply(200, { data: { device_verification_id: 'id' } })
      .post('/v2/auth/device-verifications/decide', {
        device_verification_id: 'id',
        decision: 'approve',
      })
      .reply(200, { data: { match_value: '42' } });

    await expect(withDeviceLoginParamsAsync(url)).resolves.toBe(
      `${url}&__expo_device_code=code&__expo_device_match=42&__expo_device_client=expo-go`
    );
    expect(scope.isDone()).toBe(true);
  });

  it('returns the URL unchanged when the server rejects a request', async () => {
    nock(getExpoApiBaseUrl()).post('/v2/auth/device_authorization').reply(500, 'error');

    await expect(withDeviceLoginParamsAsync(url)).resolves.toBe(url);
  });

  it('sends no request without the environment variable', async () => {
    delete process.env.EXPO_UNSTABLE_DEV_CLIENT_LOGIN;
    const scope = nock(getExpoApiBaseUrl()).post('/v2/auth/device_authorization').reply(200, {});

    await expect(withDeviceLoginParamsAsync(url)).resolves.toBe(url);
    expect(scope.isDone()).toBe(false);
  });
});
