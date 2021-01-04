import { string } from 'getenv';

const VERSION = string('SDK_VERSION', '40.0.0');

export default ({ config }) => {
  config.version = '40.0.0'; // VERSION
  config.sdkVersion = '40.0.0'; //VERSION
  config.plugins = [
    // Add a plugin to modify the AppDelegate
    './plugins/withNotFoundModule',
  ];
  return config;
};
