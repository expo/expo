import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  IOSConfig,
  withAndroidManifest,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-media-library/package.json');

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

type GranularPermissions =
  | {
      images?: boolean;
      video?: boolean;
      audio?: boolean;
      visual_user_selected?: boolean;
    }
  | false;

const getGranularPermissions = (granularPermissions?: GranularPermissions) => {
  // If no granular permissions are provided, we default to the full set of permissions for backwards compatibility.
  if (granularPermissions === undefined) {
    return [
      'android.permission.READ_MEDIA_IMAGES',
      'android.permission.READ_MEDIA_VIDEO',
      'android.permission.READ_MEDIA_AUDIO',
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
    ];
  }

  if (granularPermissions === false) {
    return [];
  }

  return Object.entries(granularPermissions).reduce<string[]>(
    (acc, [key, value]) =>
      value ? [...acc, `android.permission.READ_MEDIA_${key.toUpperCase()}`] : acc,
    []
  );
};

const withMediaLibrary: ConfigPlugin<
  {
    photosPermission?: string | false;
    savePhotosPermission?: string | false;
    isAccessMediaLocationEnabled?: boolean;
    preventAutomaticLimitedAccessAlert?: boolean;
    granularPermissions?: GranularPermissions;
  } | void
> = (
  config,
  {
    photosPermission,
    savePhotosPermission,
    isAccessMediaLocationEnabled,
    preventAutomaticLimitedAccessAlert,
    granularPermissions,
  } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSPhotoLibraryUsageDescription: 'Allow $(PRODUCT_NAME) to access your photos',
    NSPhotoLibraryAddUsageDescription: 'Allow $(PRODUCT_NAME) to save photos',
  })(config, {
    NSPhotoLibraryUsageDescription: photosPermission,
    NSPhotoLibraryAddUsageDescription: savePhotosPermission,
  });

  AndroidConfig.Permissions.withPermissions(
    config,
    [
      'android.permission.READ_EXTERNAL_STORAGE',
      'android.permission.WRITE_EXTERNAL_STORAGE',
      isAccessMediaLocationEnabled && 'android.permission.ACCESS_MEDIA_LOCATION',
      ...getGranularPermissions(granularPermissions),
    ].filter(Boolean) as string[]
  );

  if (preventAutomaticLimitedAccessAlert) {
    config = withInfoPlist(config, (config) => {
      config.modResults.PHPhotoLibraryPreventAutomaticLimitedAccessAlert = true;
      return config;
    });
  }

  return withMediaLibraryExternalStorage(config);
};

export default createRunOncePlugin(withMediaLibrary, pkg.name, pkg.version);
