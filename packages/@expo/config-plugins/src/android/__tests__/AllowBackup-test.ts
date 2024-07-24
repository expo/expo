import rnFixture from '../../plugins/__tests__/fixtures/react-native-project';
import * as XML from '../../utils/XML';
import { getAllowBackup, getAllowBackupFromManifest, setAllowBackup } from '../AllowBackup';
import { AndroidManifest } from '../Manifest';

async function getFixtureManifestAsync() {
  return (await XML.parseXMLAsync(
    rnFixture['android/app/src/main/AndroidManifest.xml']
  )) as AndroidManifest;
}

describe('allowBackup', () => {
  it(`defaults to true`, () => {
    expect(getAllowBackup({})).toBe(true);
    expect(getAllowBackup({ android: { allowBackup: false } })).toBe(false);
  });

  it('sets the allowBackup property to true', async () => {
    const androidManifestJsonUnaltered = await getFixtureManifestAsync();
    let androidManifestJson = await getFixtureManifestAsync();
    androidManifestJson = await setAllowBackup({}, { ...androidManifestJson });

    const result = getAllowBackupFromManifest(androidManifestJson);
    // The fixture has `android:allowBackup="false"`, lets test that it did in fact get modified.
    expect(getAllowBackupFromManifest(androidManifestJsonUnaltered)).not.toEqual(result);

    // Sanity check `getAllowBackupFromManifest` works as expected.
    expect(result).toBe(true);
  });
  it('sets the allowBackup property to false', async () => {
    const androidManifestJsonUnaltered = await getFixtureManifestAsync();
    let androidManifestJson = await getFixtureManifestAsync();
    androidManifestJson = await setAllowBackup(
      { android: { allowBackup: false } },
      androidManifestJson
    );

    const result = getAllowBackupFromManifest(androidManifestJson);

    expect(androidManifestJsonUnaltered).toEqual(androidManifestJson);
    expect(result).toBe(false);
  });
});
