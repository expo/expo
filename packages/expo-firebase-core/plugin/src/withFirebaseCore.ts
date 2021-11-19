import { ConfigPlugin, createRunOncePlugin } from '@expo/config-plugins';

const pkg = require('expo-firebase-core/package.json');

const withFirebaseAppDelegate: ConfigPlugin = (config) => {
  // The main purpose of this config plugin would be to include the `GoogleService-Info.plist` but currently
  // the unversioned plugin already does that.
  return config;
};

export default createRunOncePlugin(withFirebaseAppDelegate, pkg.name, pkg.version);
