import nock from 'nock';

import { getExpoApiBaseUrl } from '../../../utils/fetch-api';
import { getVersionsAsync, getReleasedVersionsAsync } from '../Versions';

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
});

describe(getReleasedVersionsAsync, () => {
  it('gets released versions', async () => {
    const scope = nock(getExpoApiBaseUrl())
      .get('/v2/versions/latest')
      .reply(200, require('./fixtures/versions-latest.json'));
    const versions = await getReleasedVersionsAsync();
    expect(Object.keys(versions)).toEqual([
      '20.0.0',
      '21.0.0',
      '22.0.0',
      '23.0.0',
      '24.0.0',
      '25.0.0',
      '26.0.0',
      '27.0.0',
      '28.0.0',
      '29.0.0',
      '30.0.0',
      '31.0.0',
      '32.0.0',
      '33.0.0',
      '34.0.0',
      '35.0.0',
      '36.0.0',
      '37.0.0',
      '38.0.0',
      '39.0.0',
      '40.0.0',
      '41.0.0',
      '42.0.0',
      '43.0.0',
      '44.0.0',
    ]);
    expect(scope.isDone()).toBe(true);
  });
});
