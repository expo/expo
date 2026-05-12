import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as XML from '../../utils/XML';
import { getIntentFilters, setAndroidIntentFilters } from '../IntentFilters';
import type { AndroidManifest } from '../Manifest';
import { getMainActivity } from '../Manifest';

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

describe('Android intent filters', () => {
  it(`returns empty array if no intent filters are provided`, () => {
    expect(getIntentFilters({})).toEqual([]);
  });

  it(`writes intent filter to android manifest`, async () => {
    let androidManifestJson = await getFixtureManifestAsync();
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

    expect(getMainActivity(androidManifestJson)!['intent-filter']).toHaveLength(3);

    // Test removing generated intent filters.
    androidManifestJson = setAndroidIntentFilters(
      {
        android: {},
      },
      androidManifestJson
    );

    expect(getMainActivity(androidManifestJson)!['intent-filter']).toHaveLength(1);
  });

  it(`writes pathAdvancedPattern intent filter data to android manifest`, async () => {
    const androidManifestJson = setAndroidIntentFilters(
      {
        android: {
          intentFilters: [
            {
              action: 'VIEW',
              data: {
                scheme: 'https',
                host: 'example.com',
                pathAdvancedPattern: '/records/[0-9]+',
              },
              category: ['BROWSABLE', 'DEFAULT'],
            },
          ],
        },
      },
      await getFixtureManifestAsync()
    );

    const [, generatedIntentFilter] = getMainActivity(androidManifestJson)!['intent-filter']!;

    expect(generatedIntentFilter.data).toEqual([
      {
        $: {
          'android:scheme': 'https',
          'android:host': 'example.com',
          'android:pathAdvancedPattern': '/records/[0-9]+',
        },
      },
    ]);
  });

  xit(`does not duplicate android intent filters`, async () => {
    let androidManifestJson = await getFixtureManifestAsync();
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

    const mainActivity = getMainActivity(androidManifestJson)!;

    expect(mainActivity['intent-filter']).toHaveLength(2);
  });
});
