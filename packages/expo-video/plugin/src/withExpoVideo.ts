import { withMediaSession } from 'expo-media-session/app.plugin';
import {
  AndroidConfig,
  type ConfigPlugin,
  withInfoPlist,
  withAndroidManifest,
} from 'expo/config-plugins';

const LEGACY_PLAYBACK_SERVICE = 'expo.modules.video.playbackService.ExpoVideoPlaybackService';

export type WithExpoVideoOptions = {
  /** Whether to enable background playback support. */
  supportsBackgroundPlayback?: boolean;
  /** Whether to enable Picture-in-Picture on Android and iOS. */
  supportsPictureInPicture?: boolean;
};

const withExpoVideo: ConfigPlugin<WithExpoVideoOptions> = (
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
    }
    return config;
  });

  withAndroidManifest(config, (config) => {
    const activity = AndroidConfig.Manifest.getMainActivityOrThrow(config.modResults);

    // Handle Picture in Picture configuration
    if (typeof supportsPictureInPicture !== 'undefined') {
      if (supportsPictureInPicture) {
        activity.$['android:supportsPictureInPicture'] = 'true';
      } else {
        delete activity.$['android:supportsPictureInPicture'];
      }
    }

    // An earlier prebuild can leave the entry of the playback service that `expo-video` no longer has.
    const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
    if (application.service) {
      application.service = application.service.filter(
        (service) => service.$['android:name'] !== LEGACY_PLAYBACK_SERVICE
      );
    }

    return config;
  });

  if (supportsBackgroundPlayback) {
    config = withMediaSession(config, { supportsBackgroundPlayback: true });
  }
  return config;
};

export default withExpoVideo;
