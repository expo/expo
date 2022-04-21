import { AndroidConfig } from '@expo/config-plugins';
import { resolve } from 'path';

import { setImagePickerInfoPlist, setImagePickerManifestActivity } from '../withImagePicker';

const fixturesPath = resolve(__dirname, 'fixtures');
const sampleManifestPath = resolve(fixturesPath, 'react-native-AndroidManifest.xml');

describe(setImagePickerManifestActivity, () => {
  it(`modifies the AndroidManifest`, async () => {
    let androidManifestJson = await AndroidConfig.Manifest.readAndroidManifestAsync(
      sampleManifestPath
    );

    androidManifestJson = setImagePickerManifestActivity(androidManifestJson);

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(androidManifestJson);
    expect(app.activity[2]).toStrictEqual({
      $: {
        'android:name': 'com.canhub.cropper.CropImageActivity',
        'android:theme': '@style/Base.Theme.AppCompat',
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
