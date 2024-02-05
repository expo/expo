import { ConfigPlugin, withInfoPlist } from '@expo/config-plugins';

const withExpoVideo: ConfigPlugin = (config) => {
  withInfoPlist(config, (config) => {
    const currentBackgroundModes = config.modResults.UIBackgroundModes ?? [];
    if (!currentBackgroundModes.includes('audio')) {
      config.modResults.UIBackgroundModes = [...currentBackgroundModes, 'audio'];
    }
    return config;
  });

  return config;
};

export default withExpoVideo;
