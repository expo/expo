import { setImagePickerInfoPlist } from '../withImagePicker';

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
