import {
  AndroidConfig,
  type ConfigPlugin,
  withInfoPlist,
  withAndroidManifest,
} from 'expo/config-plugins';

type WithExpoVideoOptions = {
  supportsBackgroundPlayback?: boolean;
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
    } else if (!shouldEnableBackgroundAudio) {
      config.modResults.UIBackgroundModes = currentBackgroundModes.filter(
        (mode: string) => mode !== 'audio'
      );
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

    // Handle background playback configuration
    if (supportsBackgroundPlayback) {
      // Add required permissions for foreground service
      AndroidConfig.Permissions.ensurePermissions(config.modResults, [
        'android.permission.FOREGROUND_SERVICE',
        'android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK',
      ]);

      // Add the foreground service to the manifest
      const application = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);

      // Check if the service already exists
      const existingService = application.service?.find(
        (service: any) =>
          service.$?.['android:name'] ===
          'expo.modules.video.playbackService.ExpoVideoPlaybackService'
      );

      if (!existingService) {
        // Add the service if it doesn't exist
        if (!application.service) {
          application.service = [];
        }

        application.service.push({
          $: {
            'android:name': 'expo.modules.video.playbackService.ExpoVideoPlaybackService',
            'android:exported': 'false',
            'android:foregroundServiceType': 'mediaPlayback',
          },
          'intent-filter': [
            {
              action: [
                {
                  $: {
                    'android:name': 'androidx.media3.session.MediaSessionService',
                  },
                },
              ],
            },
          ],
        });
      }
    }

    return config;
  });
  return config;
};

export default withExpoVideo;
