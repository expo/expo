import { AndroidConfig } from 'expo/config-plugins';
import { resolve } from 'path';

import withMediaLibrary, { modifyAndroidManifest } from '../withMediaLibrary';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe(modifyAndroidManifest, () => {
  it(`modifies the AndroidManifest`, async () => {
    let androidManifestJson =
      await AndroidConfig.Manifest.readAndroidManifestAsync(sampleManifestPath);
    androidManifestJson = modifyAndroidManifest(androidManifestJson);

    const mainApplication = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifestJson);

    expect(mainApplication.$['android:requestLegacyExternalStorage']).toBe('true');
  });
});

describe('withMediaLibrary', () => {
  it('includes all granular permissions and visual user selected by default', () => {
    const result = withMediaLibrary({
      name: 'test',
      slug: 'test',
      android: {},
    });

    const permissions = result.android?.permissions || [];

    expect(permissions).toContain('android.permission.READ_MEDIA_IMAGES');
    expect(permissions).toContain('android.permission.READ_MEDIA_VIDEO');
    expect(permissions).toContain('android.permission.READ_MEDIA_AUDIO');
    expect(permissions).toContain('android.permission.READ_MEDIA_VISUAL_USER_SELECTED');
  });

  it('includes one granular permission and visual user selected if only one is provided', () => {
    const result = withMediaLibrary(
      {
        name: 'test',
        slug: 'test',
        android: {},
      },
      {
        granularPermissions: ['photo'],
      }
    );

    const permissions = result.android?.permissions || [];

    expect(permissions).toContain('android.permission.READ_MEDIA_IMAGES');
    expect(permissions).not.toContain('android.permission.READ_MEDIA_VIDEO');
    expect(permissions).not.toContain('android.permission.READ_MEDIA_AUDIO');
    expect(permissions).toContain('android.permission.READ_MEDIA_VISUAL_USER_SELECTED');
  });

  it('includes visual user selected permission even if granularPermissions is empty', () => {
    const result = withMediaLibrary(
      {
        name: 'test',
        slug: 'test',
        android: {},
      },
      {
        granularPermissions: [],
      }
    );

    const permissions = result.android?.permissions || [];

    expect(permissions).not.toContain('android.permission.READ_MEDIA_IMAGES');
    expect(permissions).not.toContain('android.permission.READ_MEDIA_VIDEO');
    expect(permissions).not.toContain('android.permission.READ_MEDIA_AUDIO');
    expect(permissions).toContain('android.permission.READ_MEDIA_VISUAL_USER_SELECTED');
  });
});
