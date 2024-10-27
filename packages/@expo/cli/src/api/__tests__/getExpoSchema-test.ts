import nock from 'nock';

import { getExpoApiBaseUrl } from '../endpoint';
import { getAssetSchemasAsync, _getSchemaAsync } from '../getExpoSchema';

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

  describe('_getSchemaAsync', () => {
    test.each([['44.0.0'], ['UNVERSIONED']])('for SDK %s', async (sdkVersion) => {
      // NOTE(@kitten): The schema definitions contain JSON schema `$ref`s
      // We expect these to have been resolved
      const schema = await _getSchemaAsync(sdkVersion);

      expect(schema).toHaveProperty(
        [
          'definitions',
          'Android',
          'properties',
          'intentFilters',
          'items',
          'properties',
          'data',
          'anyOf',
          0,
        ],
        schema.definitions.AndroidIntentFiltersData
      );

      expect(schema).toHaveProperty(
        [
          'definitions',
          'Android',
          'properties',
          'intentFilters',
          'items',
          'properties',
          'data',
          'anyOf',
          1,
          'items',
        ],
        schema.definitions.AndroidIntentFiltersData
      );

      expect(schema).toHaveProperty(['properties', 'splash'], schema.definitions.Splash);

      expect(schema).toHaveProperty(['properties', 'ios'], schema.definitions.IOS);

      expect(schema).toHaveProperty(['properties', 'android'], schema.definitions.Android);

      expect(schema).toHaveProperty(['properties', 'web'], schema.definitions.Web);

      expect(schema).toHaveProperty(
        ['properties', 'hooks', 'properties', 'postPublish', 'items'],
        schema.definitions.PublishHook
      );

      expect(schema).toHaveProperty(
        ['properties', 'hooks', 'properties', 'postExport', 'items'],
        schema.definitions.PublishHook
      );
    });
  });
});
