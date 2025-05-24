import {
  ConfigPlugin,
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
  IOSConfig,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-media-library/package.json');

type GranularPermission = 'photo' | 'video' | 'audio';
const GRANULAR_PERMISSIONS_MAP: Record<GranularPermission, string> = {
  photo: 'android.permission.READ_MEDIA_IMAGES',
  video: 'android.permission.READ_MEDIA_VIDEO',
  audio: 'android.permission.READ_MEDIA_AUDIO',
};
const defaultGranularPermissions: GranularPermission[] = ['photo', 'video', 'audio'];

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
    photosPermission?: string | false;
    savePhotosPermission?: string | false;
    isAccessMediaLocationEnabled?: boolean;
    preventAutomaticLimitedAccessAlert?: boolean;
    granularPermissions?: GranularPermission[];
  } | void
> = (
  config,
  {
    photosPermission,
    savePhotosPermission,
    isAccessMediaLocationEnabled,
    preventAutomaticLimitedAccessAlert,
    granularPermissions = defaultGranularPermissions,
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
      'android.permission.READ_MEDIA_VISUAL_USER_SELECTED',
      isAccessMediaLocationEnabled && 'android.permission.ACCESS_MEDIA_LOCATION',
      ...granularPermissions.map((type) => GRANULAR_PERMISSIONS_MAP[type]),
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
