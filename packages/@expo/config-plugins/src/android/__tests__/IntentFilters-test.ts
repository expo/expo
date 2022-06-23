import { resolve } from 'path';

import { getIntentFilters, setAndroidIntentFilters } from '../IntentFilters';
import { getMainActivity, readAndroidManifestAsync } from '../Manifest';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe('Android intent filters', () => {
  it(`returns empty array if no intent filters are provided`, () => {
    expect(getIntentFilters({})).toEqual([]);
  });

  it(`writes intent filter to android manifest`, async () => {
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = setAndroidIntentFilters(
      {
        android: {
          intentFilters: [
            {
              action: 'VIEW',
              data: {
                scheme: 'https',
                host: '*.myapp.io',
              },
              category: ['BROWSABLE', 'DEFAULT'],
            },
            {
              autoVerify: false,
              action: 'VIEW',
              data: {
                scheme: 'https',
                host: 'test.foo.bar',
                pathPrefix: '/deeplink',
              },
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        },
      },
      androidManifestJson
    );

    expect(getMainActivity(androidManifestJson)['intent-filter']).toHaveLength(3);

    // Test removing generated intent filters.
    androidManifestJson = setAndroidIntentFilters(
      {
        android: {},
      },
      androidManifestJson
    );

    expect(getMainActivity(androidManifestJson)['intent-filter']).toHaveLength(1);
  });

  xit(`does not duplicate android intent filters`, async () => {
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = setAndroidIntentFilters(
      {
        android: {
          intentFilters: [
            {
              action: 'VIEW',
              data: {
                scheme: 'https',
                host: '*.myapp.io',
              },
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        },
      },
      androidManifestJson
    );

    androidManifestJson = setAndroidIntentFilters(
      {
        android: {
          intentFilters: [
            {
              action: 'VIEW',
              data: {
                scheme: 'https',
                host: '*.myapp.io',
              },
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        },
      },
      androidManifestJson
    );

    const mainActivity = getMainActivity(androidManifestJson);

    expect(mainActivity['intent-filter']).toHaveLength(2);
  });
});
