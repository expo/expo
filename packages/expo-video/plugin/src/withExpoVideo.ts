import {
  AndroidConfig,
  ConfigPlugin,
  withInfoPlist,
  withAndroidManifest,
} from '@expo/config-plugins';

const withExpoVideo: ConfigPlugin = (config) => {
  withInfoPlist(config, (config) => {
    const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
    if (!currentBackgroundModes.includes('audio')) {
      config.modResults.UIBackgroundModes = [...currentBackgroundModes, 'audio'];
    }
    return config;
  });

  withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);
    activity.$['android:supportsPictureInPicture'] = 'true';
    return config;
  });
  return config;
};

export default withExpoVideo;
