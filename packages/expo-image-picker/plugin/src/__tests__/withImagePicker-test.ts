import { readAndroidManifestAsync } from '@expo/config-plugins/build/android/Manifest';
import path from 'path';

import { setImagePickerInfoPlist, withAndroidImagePickerPermissions } from '../withImagePicker';

function getMockAndroidManifest() {
  return readAndroidManifestAsync(
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

    expect(config.android.permissions).toEqual(['android.permission.RECORD_AUDIO']);

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

describe(setImagePickerInfoPlist, () => {
  it(`adds defaults to the plist`, () => {
    expect(setImagePickerInfoPlist({}, {})).toStrictEqual({
      NSCameraUsageDescription: 'Allow $(PRODUCT_NAME) to access your camera',
      NSMicrophoneUsageDescription: 'Allow $(PRODUCT_NAME) to access your microphone',
      NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to access your photos',
    });
  });

  it(`uses custom messages`, () => {
    expect(
      setImagePickerInfoPlist(
        {
          NSPhotoLibraryUsageDescription: 'foobar',
          NSCameraUsageDescription: 'foobar',
          NSMicrophoneUsageDescription: 'foobar',
        },
        {
          cameraPermission: 'yolo',
        }
      )
    ).toStrictEqual({
      NSCameraUsageDescription: 'yolo',
      NSMicrophoneUsageDescription: 'foobar',
      NSPhotoLibraryUsageDescription: 'foobar',
    });
  });

  it(`disables defaults explicitly`, () => {
    expect(
      setImagePickerInfoPlist(
        {
          NSPhotoLibraryUsageDescription: 'foobar',
          NSCameraUsageDescription: 'foobar',
          NSMicrophoneUsageDescription: 'foobar',
        },
        {
          cameraPermission: false,
          microphonePermission: false,
          photosPermission: false,
        }
      )
    ).toStrictEqual({});
  });
});
