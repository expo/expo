import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { getNativeModuleVersionsAsync } from '../getNativeModuleVersions';

beforeAll(() => {
  process.env.EXPO_NO_CACHE = 'true';
});

describe(getNativeModuleVersionsAsync, () => {
  it('gets versions', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/sdks/44.0.0/native-modules')
      .reply(200, require('./fixtures/native-modules/44.0.0.json'));
    const versions = await getNativeModuleVersionsAsync('44.0.0');

    expect(Object.keys(versions).length).toBeGreaterThan(4);

    for (const [key, value] of Object.entries(versions)) {
      expect(typeof key).toBe('string');
      expect(typeof value).toBe('string');
    }

    expect(scope.isDone()).toBe(true);
  });
  it('fails when the servers are down', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/sdks/44.0.0/native-modules')
      .reply(500, 'something went wrong');
    await expect(getNativeModuleVersionsAsync('44.0.0')).rejects.toThrowError(/Expo server/);
    expect(scope.isDone()).toBe(true);
  });
});
