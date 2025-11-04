import { Colors } from '@expo/config-plugins/build/android';
import {
  AndroidConfig,
  type ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withAndroidColors,
  withAndroidColorsNight,
} from 'expo/config-plugins';

const pkg = require('expo-image-picker/package.json');

const CAMERA_USAGE = 'Allow $(PRODUCT_NAME) to access your camera';
const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';
const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';

type ImagePickerColors = {
  cropToolbarColor?: string;
  cropToolbarIconColor?: string;
  cropToolbarActionTextColor?: string;
  cropBackButtonIconColor?: string;
  cropBackgroundColor?: string;
};

type Props = {
  photosPermission?: string | false;
  cameraPermission?: string | false;
  microphonePermission?: string | false;
  colors?: ImagePickerColors;
  dark?: {
    colors?: ImagePickerColors;
  };
};

export const withAndroidImagePickerPermissions: ConfigPlugin<Props | void> = (
  config,
  { cameraPermission, microphonePermission } = {}
) => {
  if (microphonePermission !== false) {
    config = AndroidConfig.Permissions.withPermissions(config, ['android.permission.RECORD_AUDIO']);
  }

  // If the user manually sets any of the permissions to `false`, then we should block the permissions to ensure no
  // package can add them.
  config = AndroidConfig.Permissions.withBlockedPermissions(
    config,
    [
      microphonePermission === false && 'android.permission.RECORD_AUDIO',
      cameraPermission === false && 'android.permission.CAMERA',
    ].filter(Boolean) as string[]
  );

  // NOTE(EvanBacon): It's unclear if we should block the WRITE_EXTERNAL_STORAGE/READ_EXTERNAL_STORAGE permissions since
  // they're used for many other things besides image picker.

  return config;
};

/**
 * Sets image picker colors in the Android colors.xml resource file
 */
function setImagePickerColors(
  colors: AndroidConfig.Resources.ResourceXML,
  pickerColors?: ImagePickerColors
): AndroidConfig.Resources.ResourceXML {
  if (!pickerColors) {
    return colors;
  }

  const colorMapping: Record<keyof ImagePickerColors, string> = {
    cropToolbarColor: 'expoCropToolbarColor',
    cropToolbarIconColor: 'expoCropToolbarIconColor',
    cropToolbarActionTextColor: 'expoCropToolbarActionTextColor',
    cropBackButtonIconColor: 'expoCropBackButtonIconColor',
    cropBackgroundColor: 'expoCropBackgroundColor',
  };

  let result = colors;
  for (const [key, colorName] of Object.entries(colorMapping)) {
    const colorValue = pickerColors[key as keyof ImagePickerColors];
    if (colorValue) {
      result = Colors.assignColorValue(result, { value: colorValue, name: colorName });
    }
  }

  return result;
}

const withImagePicker: ConfigPlugin<Props | void> = (
  config,
  { photosPermission, cameraPermission, microphonePermission, colors, dark } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSPhotoLibraryUsageDescription: READ_PHOTOS_USAGE,
    NSCameraUsageDescription: CAMERA_USAGE,
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, {
    NSPhotoLibraryUsageDescription: photosPermission,
    NSCameraUsageDescription: cameraPermission,
    NSMicrophoneUsageDescription: microphonePermission,
  });

  if (microphonePermission !== false) {
    config = AndroidConfig.Permissions.withPermissions(config, ['android.permission.RECORD_AUDIO']);
  }

  // If the user manually sets any of the permissions to `false`, then we should block the permissions to ensure no
  // package can add them.
  config = AndroidConfig.Permissions.withBlockedPermissions(
    config,
    [
      microphonePermission === false && 'android.permission.RECORD_AUDIO',
      cameraPermission === false && 'android.permission.CAMERA',
    ].filter(Boolean) as string[]
  );

  // NOTE(EvanBacon): It's unclear if we should block the WRITE_EXTERNAL_STORAGE/READ_EXTERNAL_STORAGE permissions since
  // they're used for many other things besides image picker.

  // Apply color configurations for light theme
  config = withAndroidColors(config, (config) => {
    config.modResults = setImagePickerColors(config.modResults, colors);
    return config;
  });

  // Apply color configurations for dark theme
  config = withAndroidColorsNight(config, (config) => {
    config.modResults = setImagePickerColors(config.modResults, dark?.colors);
    return config;
  });

  return config;
};

export default createRunOncePlugin(withImagePicker, pkg.name, pkg.version);
