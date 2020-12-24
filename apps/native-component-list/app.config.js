import { string } from 'getenv';

const VERSION = string('SDK_VERSION', 'UNVERSIONED');

export default ({ config }) => {
    config.version = VERSION
    config.sdkVersion = VERSION
    return config;
}