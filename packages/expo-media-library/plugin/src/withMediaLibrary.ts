import {
  ConfigPlugin,
  withAndroidManifest,
  AndroidConfig,
  createRunOncePlugin,
  IOSConfig,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-media-library/package.json');

type GranularTypes = 'photo' | 'video' | 'audio';
const GRANULAR_PERMISSIONS_MAP: Record<GranularTypes, string> = {
  photo: 'android.permission.READ_MEDIA_IMAGES',
  video: 'android.permission.READ_MEDIA_VIDEO',
  audio: 'android.permission.READ_MEDIA_AUDIO',
};

export function modifyAndroidManifest(
  manifest: AndroidConfig.Manifest.AndroidManifest,
  granularPermissions?: GranularTypes[]
): AndroidConfig.Manifest.AndroidManifest {
  // Starting with Android 10, the concept of scoped storage is introduced.
  // Currently, to make expo-media-library working with that change, you have to add
  // android:requestLegacyExternalStorage="true" to AndroidManifest.xml:
  const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
  app.$['android:requestLegacyExternalStorage'] = 'true';

  // If granular permissions are specified, remove the defaults and add only the specified ones
  if (granularPermissions) {
    AndroidConfig.Permissions.removePermissions(manifest, Object.values(GRANULAR_PERMISSIONS_MAP));
    AndroidConfig.Permissions.ensurePermissions(
      manifest,
      granularPermissions.map((type) => GRANULAR_PERMISSIONS_MAP[type])
    );
  }

  return manifest;
}

const withMediaLibraryExternalStorage: ConfigPlugin = (config) => {
  return withAndroidManifest(config, async (config) => {
    config.modResults = modifyAndroidManifest(config.modResults);
    return config;
  });
};

const withGranularPermissions: ConfigPlugin<GranularTypes[]> = (config, granularPermissions) => {
  return withAndroidManifest(config, (config) => {
    config.modResults = modifyAndroidManifest(config.modResults, granularPermissions);
    return config;
  });
};

const withMediaLibrary: ConfigPlugin<
  {
    photosPermission?: string | false;
    savePhotosPermission?: string | false;
    isAccessMediaLocationEnabled?: boolean;
    preventAutomaticLimitedAccessAlert?: boolean;
    granularPermissions?: GranularTypes[];
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
    ].filter(Boolean) as string[]
  );

  if (granularPermissions) {
    config = withGranularPermissions(config, granularPermissions);
  }

  if (preventAutomaticLimitedAccessAlert) {
    config = withInfoPlist(config, (config) => {
      config.modResults.PHPhotoLibraryPreventAutomaticLimitedAccessAlert = true;
      return config;
    });
  }

  return withMediaLibraryExternalStorage(config);
};

export default createRunOncePlugin(withMediaLibrary, pkg.name, pkg.version);
