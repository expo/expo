import { AndroidConfig } from 'expo/config-plugins';
import path from 'path';

import withImagePicker, { withAndroidImagePickerPermissions } from '../withImagePicker';

function getMockAndroidManifest() {
  return AndroidConfig.Manifest.readAndroidManifestAsync(
    path.resolve(__dirname, 'fixtures/react-native-AndroidManifest.xml')
  );
}

describe(withAndroidImagePickerPermissions, () => {
  it(`defaults to adding permissions`, async () => {
    const config = withAndroidImagePickerPermissions(
      {
        slug: '',
        name: '',
      },
      {}
    );

    const { modResults } = await (config as any).mods.android.manifest({
      modRequest: {},
      modResults: await getMockAndroidManifest(),
    });

    expect(config.android?.permissions).toEqual(['android.permission.RECORD_AUDIO']);

    expect(modResults).toEqual({
      manifest: {
        $: {
          'xmlns:android': expect.any(String),
          package: expect.any(String),
          // Added tools
          'xmlns:tools': 'http://schemas.android.com/tools',
        },
        'uses-permission': [
          expect.anything(),
          // Added two blocked permissions
        ],
        queries: expect.anything(),
        application: expect.anything(),
      },
    });
  });
  it(`adds blocked permissions when the user passes in false for properties`, async () => {
    const config = withAndroidImagePickerPermissions(
      {
        slug: '',
        name: '',
      },
      {
        cameraPermission: false,
        microphonePermission: false,

        // Does nothing...
        photosPermission: false,
      }
    );

    const { modResults } = await (config as any).mods.android.manifest({
      modRequest: {},
      modResults: await getMockAndroidManifest(),
    });

    expect(modResults).toEqual({
      manifest: {
        $: {
          'xmlns:android': expect.any(String),
          package: expect.any(String),
          // Added tools
          'xmlns:tools': 'http://schemas.android.com/tools',
        },
        'uses-permission': [
          expect.anything(),
          // Added two blocked permissions
          {
            $: {
              'android:name': 'android.permission.RECORD_AUDIO',
              'tools:node': 'remove',
            },
          },
          {
            $: {
              'android:name': 'android.permission.CAMERA',
              'tools:node': 'remove',
            },
          },
        ],
        queries: expect.anything(),
        application: expect.anything(),
      },
    });
  });
});

describe('withImagePicker iOS camera permission', () => {
  it('does not delete NSCameraUsageDescription when cameraPermission is false', async () => {
    const config = withImagePicker(
      {
        slug: '',
        name: '',
      },
      {
        photosPermission: 'Pick a photo.',
        cameraPermission: false,
      }
    );

    const { modResults } = await (config as any).mods.ios.infoPlist({
      modRequest: {},
      modResults: { NSCameraUsageDescription: 'Scan QR codes.' },
    });

    expect(modResults.NSCameraUsageDescription).toBe('Scan QR codes.');
  });

  it('sets NSCameraUsageDescription when cameraPermission is a string', async () => {
    const config = withImagePicker(
      {
        slug: '',
        name: '',
      },
      {
        cameraPermission: 'Take a photo.',
      }
    );

    const { modResults } = await (config as any).mods.ios.infoPlist({
      modRequest: {},
      modResults: {},
    });

    expect(modResults.NSCameraUsageDescription).toBe('Take a photo.');
  });
});
