import { createRunOncePlugin } from 'expo/config-plugins';

const pkg = require('expo-dev-launcher/package.json');

// no-op after SDK 44
export default createRunOncePlugin<void>((config) => config, pkg.name, pkg.version);
