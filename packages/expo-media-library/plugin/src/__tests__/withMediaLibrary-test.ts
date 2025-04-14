import { AndroidConfig } from 'expo/config-plugins';
import { resolve } from 'path';

import { modifyAndroidManifest } from '../withMediaLibrary';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');
const sampleManifestPermissions = [
  'android.permission.INTERNET',
  'android.permission.READ_MEDIA_AUDIO',
];

describe(modifyAndroidManifest, () => {
  it(`modifies the AndroidManifest`, async () => {
    let androidManifestJson =
      await AndroidConfig.Manifest.readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = modifyAndroidManifest(androidManifestJson);

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifestJson);

    expect(mainApplication.$['android:requestLegacyExternalStorage']).toBe('true');

    const modifiedPermissions = AndroidConfig.Permissions.getPermissions(androidManifestJson);
    expect(modifiedPermissions).toEqual(sampleManifestPermissions);
  });

  it(`modifies the AndroidManifest with granular permissions`, async () => {
    let androidManifestJson =
      await AndroidConfig.Manifest.readAndroidManifestAsync(sampleManifestPath);

    androidManifestJson = modifyAndroidManifest(androidManifestJson, ['photo', 'audio', 'video']);
    const modifiedPermissions = AndroidConfig.Permissions.getPermissions(androidManifestJson);

    expect(modifiedPermissions).toContain('android.permission.READ_MEDIA_IMAGES');
    expect(modifiedPermissions).toContain('android.permission.READ_MEDIA_AUDIO');
    expect(modifiedPermissions).toContain('android.permission.READ_MEDIA_VIDEO');
  });

  it(`modifies the AndroidManifest with empty granular permissions`, async () => {
    let androidManifestJson =
      await AndroidConfig.Manifest.readAndroidManifestAsync(sampleManifestPath);

    androidManifestJson = modifyAndroidManifest(androidManifestJson, []);
    const modifiedPermissions = AndroidConfig.Permissions.getPermissions(androidManifestJson);

    expect(modifiedPermissions).not.toContain('android.permission.READ_MEDIA_IMAGES');
    expect(modifiedPermissions).not.toContain('android.permission.READ_MEDIA_AUDIO');
    expect(modifiedPermissions).not.toContain('android.permission.READ_MEDIA_VIDEO');
  });
});
