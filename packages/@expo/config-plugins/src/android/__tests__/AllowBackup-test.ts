import { resolve } from 'path';

import { getAllowBackup, getAllowBackupFromManifest, setAllowBackup } from '../AllowBackup';
import { readAndroidManifestAsync } from '../Manifest';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe('allowBackup', () => {
  it(`defaults to true`, () => {
    expect(getAllowBackup({})).toBe(true);
    expect(getAllowBackup({ android: { allowBackup: false } })).toBe(false);
  });

  it('sets the allowBackup property to true', async () => {
    const androidManifestJsonUnaltered = await readAndroidManifestAsync(sampleManifestPath);
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = await setAllowBackup({}, { ...androidManifestJson });

    const result = getAllowBackupFromManifest(androidManifestJson);
    expect(androidManifestJsonUnaltered).toEqual(androidManifestJson);
    // Sanity check `getAllowBackupFromManifest` works as expected.
    expect(result).toBe(true);
  });
  it('sets the allowBackup property to false', async () => {
    const androidManifestJsonUnaltered = await readAndroidManifestAsync(sampleManifestPath);
    let androidManifestJson = await readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = await setAllowBackup(
      { android: { allowBackup: false } },
      androidManifestJson
    );

    const result = getAllowBackupFromManifest(androidManifestJson);
    // The fixture has `android:allowBackup="true"`, lets test that it did in fact get modified.
    expect(getAllowBackupFromManifest(androidManifestJsonUnaltered)).not.toEqual(result);
    expect(result).toBe(false);
  });
});
