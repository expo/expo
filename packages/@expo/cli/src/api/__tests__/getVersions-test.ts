import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { getVersionsAsync } from '../getVersions';

beforeAll(() => {
  process.env.EXPO_NO_CACHE = 'true';
});

describe(getVersionsAsync, () => {
  it('gets versions', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/versions/latest')
      .reply(200, require('./fixtures/versions-latest.json'));
    const versions = await getVersionsAsync();
    expect(versions).toEqual(require('./fixtures/versions-latest.json').data);
    expect(scope.isDone()).toBe(true);
  });
  it('fails when the servers are down', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/versions/latest')
      .reply(500, 'something went wrong');
    await expect(getVersionsAsync()).rejects.toThrowError(/Expo server/);
    expect(scope.isDone()).toBe(true);
  });
});
