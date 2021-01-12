const pkg = require('./package.json');
const {
  createRunOncePlugin,
  withPlugins,
  withAndroidManifest,
  AndroidConfig,
} = require('@expo/config-plugins');

const READ_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to access your photos';
const WRITE_PHOTOS_USAGE = 'Allow $(PRODUCT_NAME) to save photos';

const withMediaLibraryExternalStorage = config => {
  return withAndroidManifest(config, async config => {
    // Starting with Android 10, the concept of scoped storage is introduced.
    // Currently, to make expo-media-library working with that change, you have to add
    // android:requestLegacyExternalStorage="true" to AndroidManifest.xml:
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    app.$['android:requestLegacyExternalStorage'] = 'true';
    return config;
  });
};

const withMediaLibrary = (config, { photosPermission, savePhotosPermission } = {}) => {
  if (!config.ios) config.ios = {};
  if (!config.ios.infoPlist) config.ios.infoPlist = {};
  config.ios.infoPlist.NSPhotoLibraryUsageDescription =
    photosPermission || config.ios.infoPlist.NSPhotoLibraryUsageDescription || READ_PHOTOS_USAGE;
  config.ios.infoPlist.NSPhotoLibraryAddUsageDescription =
    savePhotosPermission ||
    config.ios.infoPlist.NSPhotoLibraryAddUsageDescription ||
    WRITE_PHOTOS_USAGE;

  return withPlugins(config, [
    [
      AndroidConfig.Permissions.withPermissions,
      ['android.permission.READ_EXTERNAL_STORAGE', 'android.permission.WRITE_EXTERNAL_STORAGE'],
    ],
    withMediaLibraryExternalStorage,
  ]);
};

module.exports = createRunOncePlugin(withMediaLibrary, pkg.name, pkg.version);
