import {
  AndroidConfig,
  ConfigPlugin,
  createRunOncePlugin,
  withDangerousMod,
} from 'expo/config-plugins';

const pkg = require('expo-app-integrity/package.json');

type PluginConfig = {
  cloudProjectNumber?: string;
};

const withAppIntegrity: ConfigPlugin<PluginConfig> = (config, { cloudProjectNumber } = {}) => {
  return withDangerousMod(config, [
    'android',
    async (config) => {
      console.log({ modResults: config.modResults });
      return config;
    },
  ]);
};

export default createRunOncePlugin(withAppIntegrity, pkg.name, pkg.version);
