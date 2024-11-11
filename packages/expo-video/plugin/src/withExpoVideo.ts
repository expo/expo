import {
  AndroidConfig,
  type ConfigPlugin,
  withInfoPlist,
  withAndroidManifest,
} from 'expo/config-plugins';

export type WithExpoVideoProps = {
  supportsBackgroundPlayback?: boolean;
  supportsPictureInPicture?: boolean;
};

const withExpoVideo: ConfigPlugin<WithExpoVideoProps | void> = (
  config,
  { supportsBackgroundPlayback, supportsPictureInPicture } = {}
) => {
  withInfoPlist(config, (config) => {
    const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
    const shouldEnableBackgroundAudio = supportsBackgroundPlayback || supportsPictureInPicture;

    // No-op if the values are not defined
    if (
      typeof supportsBackgroundPlayback === 'undefined' &&
      typeof supportsPictureInPicture === 'undefined'
    ) {
      return config;
    }

    if (shouldEnableBackgroundAudio && !currentBackgroundModes.includes('audio')) {
      config.modResults.UIBackgroundModes = [...currentBackgroundModes, 'audio'];
    } else if (!shouldEnableBackgroundAudio) {
      config.modResults.UIBackgroundModes = currentBackgroundModes.filter(
        (mode: string) => mode !== 'audio'
      );
    }
    return config;
  });

  withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);

    // No-op if the values are not defined
    if (typeof supportsPictureInPicture === 'undefined') {
      return config;
    }

    if (supportsPictureInPicture) {
      activity.$['android:supportsPictureInPicture'] = 'true';
    } else {
      delete activity.$['android:supportsPictureInPicture'];
    }
    return config;
  });
  return config;
};

export default withExpoVideo;
