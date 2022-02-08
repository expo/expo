import { AndroidConfig } from '@expo/config-plugins';
import { resolve } from 'path';

import { setImagePickerManifestActivity } from '../withImagePicker';

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
