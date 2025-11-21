import {
  AndroidConfig,
  ConfigPlugin,
  IOSConfig,
  createRunOncePlugin,
  withInfoPlist,
} from 'expo/config-plugins';

const pkg = require('expo-audio/package.json');

const MICROPHONE_USAGE = 'Allow $(PRODUCT_NAME) to access your microphone';

const withAudio: ConfigPlugin<
  {
    microphonePermission?: string | false;
    recordAudioAndroid?: boolean;
    enableBackgroundRecording?: boolean;
  } | void
> = (
  config,
  { microphonePermission, recordAudioAndroid = true, enableBackgroundRecording = false } = {}
) => {
  IOSConfig.Permissions.createPermissionsPlugin({
    NSMicrophoneUsageDescription: MICROPHONE_USAGE,
  })(config, {
    NSMicrophoneUsageDescription: microphonePermission,
  });

  if (enableBackgroundRecording) {
    config = withInfoPlist(config, (config) => {
      if (!Array.isArray(config.modResults.UIBackgroundModes)) {
        config.modResults.UIBackgroundModes = [];
      }
      if (!config.modResults.UIBackgroundModes.includes('audio')) {
        config.modResults.UIBackgroundModes.push('audio');
      }
      return config;
    });
  }

  return AndroidConfig.Permissions.withPermissions(
    config,
    [
      recordAudioAndroid !== false && 'android.permission.RECORD_AUDIO',
      'android.permission.MODIFY_AUDIO_SETTINGS',
    ].filter(Boolean) as string[]
  );
};

export default createRunOncePlugin(withAudio, pkg.name, pkg.version);
