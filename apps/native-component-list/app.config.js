import { string } from 'getenv';

const SDK_VERSION = string('SDK_VERSION', 'UNVERSIONED');

export default ({ config }) => {
  config.version = SDK_VERSION;
  config.sdkVersion = SDK_VERSION;
  return config;
};