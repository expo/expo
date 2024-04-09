import {
  ConfigPlugin,
  withPlugins,
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-media-library/package.json');

const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';
const WRITE_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to save photos';

export function modifyAndroidManifest(
  manifest: AndroidConfig.Manifest.AndroidManifest
): AndroidConfig.Manifest.AndroidManifest {
  // Starting with Android 10, the concept of scoped storage is introduced.
  // Currently, to make expo-media-library working with that change, you have to add
  // android:requestLegacyExternalStorage="true" to AndroidManifest.xml:
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  app.$['android:requestLegacyExternalStorage'] = 'true';
  return manifest;
}

const withMediaLibraryExternalStorage: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = modifyAndroidManifest(config.modResults);
    return config;
  });
};

const withMediaLibrary: ConfigPlugin<
  {
    photosPermission?: string;
    savePhotosPermission?: string;
    isAccessMediaLocationEnabled?: boolean;
  } | void
> = (config, { photosPermission, savePhotosPermission, isAccessMediaLocationEnabled } = {}) => {
  withInfoPlist(config, (config) => {
    config.modResults.NSPhotoLibraryUsageDescription =
      photosPermission || config.modResults.NSPhotoLibraryUsageDescription || READ_PHOTOS_USAGE;
    config.modResults.NSPhotoLibraryAddUsageDescription =
      savePhotosPermission ||
      config.modResults.NSPhotoLibraryAddUsageDescription ||
      WRITE_PHOTOS_USAGE;
    return config;
  });

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      [
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        isAccessMediaLocationEnabled && 'android.permission.ACCESS_MEDIA_LOCATION',
      ].filter(Boolean),
    ],
    withMediaLibraryExternalStorage,
  ]);
};

export default createRunOncePlugin(withMediaLibrary, pkg.name, pkg.version);
