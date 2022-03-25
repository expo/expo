import nock from 'nock';
import { parse } from 'semver';

import { getExpoApiBaseUrl } from '../endpoint';
import { getReleasedVersionsAsync, getVersionsAsync } from '../getVersions';

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

describe(getReleasedVersionsAsync, () => {
  it('gets released versions', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/versions/latest')
      .reply(200, require('./fixtures/versions-latest.json'));
    const versions = await getReleasedVersionsAsync();
    // A list of SDK versions like `43.0.0`
    expect(
      Object.keys(versions).every((value) => {
        return parse(value) && value.endsWith('.0.0');
      })
    );
    expect(scope.isDone()).toBe(true);
  });
});
