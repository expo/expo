import { resolve } from 'path';

import { getMainActivity, readAndroidManifestAsync } from '../Manifest';
import { getOrientation, setAndroidOrientation } from '../Orientation';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe('Android orientation', () => {
  it(`returns null if no orientation is provided`, () => {
    expect(getOrientation({})).toBe(null);
  });

  it(`returns orientation if provided`, () => {
    expect(getOrientation({ orientation: 'landscape' })).toMatch('landscape');
  });

  describe('File changes', () => {
    let androidManifestJson;
    it('adds orientation attribute if not present', async () => {
      androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
      androidManifestJson = await setAndroidOrientation(
        { orientation: 'landscape' },
        androidManifestJson
      );

      const mainActivity = getMainActivity(androidManifestJson);

      expect(mainActivity.$['android:screenOrientation']).toMatch('landscape');
    });

    it('replaces orientation attribute if present', async () => {
      androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);

      androidManifestJson = await setAndroidOrientation(
        { orientation: 'portrait' },
        androidManifestJson
      );

      const mainActivity = getMainActivity(androidManifestJson);

      expect(mainActivity.$['android:screenOrientation']).toMatch('portrait');
    });

    it('replaces orientation with unspecified if provided default', async () => {
      androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
      androidManifestJson = await setAndroidOrientation(
        { orientation: 'default' },
        androidManifestJson
      );

      const mainActivity = getMainActivity(androidManifestJson);

      expect(mainActivity.$['android:screenOrientation']).toMatch('unspecified');
    });
  });
});
