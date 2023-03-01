import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as XML from '../../utils/XML';
import { AndroidManifest, getMainActivity } from '../Manifest';
import { getOrientation, setAndroidOrientation } from '../Orientation';

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

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
      androidManifestJson = await getFixtureManifestAsync();
      androidManifestJson = await setAndroidOrientation(
        { orientation: 'landscape' },
        androidManifestJson
      );

      const mainActivity = getMainActivity(androidManifestJson);

      expect(mainActivity!.$['android:screenOrientation']).toMatch('landscape');
    });

    it('replaces orientation attribute if present', async () => {
      androidManifestJson = await getFixtureManifestAsync();

      androidManifestJson = await setAndroidOrientation(
        { orientation: 'portrait' },
        androidManifestJson
      );

      const mainActivity = getMainActivity(androidManifestJson);

      expect(mainActivity!.$['android:screenOrientation']).toMatch('portrait');
    });

    it('replaces orientation with unspecified if provided default', async () => {
      androidManifestJson = await getFixtureManifestAsync();
      androidManifestJson = await setAndroidOrientation(
        { orientation: 'default' },
        androidManifestJson
      );

      const mainActivity = getMainActivity(androidManifestJson);

      expect(mainActivity!.$['android:screenOrientation']).toMatch('unspecified');
    });
  });
});
