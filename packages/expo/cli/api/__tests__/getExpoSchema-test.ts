import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { getAssetSchemasAsync } from '../getExpoSchema';

beforeAll(() => {
  process.env.EXPO_NO_CACHE = 'true';
});

describe(`getAssetSchemasAsync return array of strings including some known values`, () => {
  beforeAll(() => {
    nock(getExpoApiBaseUrl())
      .get('/v2/project/configuration/schema/UNVERSIONED')
      .reply(200, require('./fixtures/UNVERSIONED.json'));
    nock(getExpoApiBaseUrl())
      .get('/v2/project/configuration/schema/44.0.0')
      .reply(200, require('./fixtures/44.0.0.json'));
  });

  test.each([
    [
      '44.0.0',
      ['icon', 'notification.icon', 'splash.image', 'ios.splash.xib', 'android.splash.xxhdpi'],
    ],
    [
      'UNVERSIONED',
      ['icon', 'notification.icon', 'splash.image', 'ios.splash.xib', 'android.splash.xxhdpi'],
    ],
  ])('for SDK %s', async (sdkVersion, expectedAssetsPaths) => {
    const schemas = await getAssetSchemasAsync(sdkVersion);
    for (const field of schemas) {
      expect(field).toEqual(expect.any(String));
    }
    for (const el of expectedAssetsPaths) {
      expect(schemas).toContain(el);
    }
  });
});
