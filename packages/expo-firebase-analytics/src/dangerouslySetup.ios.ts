import * as path from 'path';
import ExpoFirebaseAnalytics from './ExpoFirebaseAnalytics';
import parseConfig from './parseConfig';

let hasWarned = false;

function warnOnce() {
  if (hasWarned) return;
  hasWarned = true;
  console.warn(
    `expo-firebas-analyics requires a native Firebase project to be setup and the config file (\`GoogleService-Info.plist\`) to be linked in the project's \`app.json\` under \`expo.ios.googleServicesFile\`. Read more here: https://docs.expo.io/versions/v36.0.0/guides/using-firebase/`
  );
}

function attemptToGetConfig() {
  try {
    const Constants = require('expo-constants');
    return Constants.manifest;
  } catch (error) {}
  try {
    const manifest = require('../../../app.json');
    return manifest.expo || manifest;
  } catch (error) {}

  return null;
}

function attemptToGetGoogleManifest() {
  const manifest = attemptToGetConfig();
  if (manifest && manifest.ios && manifest.googleServicesFile) {
    try {
      return require(path.join('../../../', manifest.googleServicesFile));
    } catch (error) {}
  }
}

// @ts-ignore
if (global.__DEV__) {
  // Only use setup on iOS in dev mode
  const services = attemptToGetGoogleManifest();
  if (services) {
    ExpoFirebaseAnalytics.initializeAppDangerously(parseConfig(services));
  } else {
    warnOnce();
  }
}
