const findProjectRootSync = require('expo-modules-autolinking/exports').findProjectRootSync;
const fs = require('fs');
const path = require('path');

const projectRoot = findProjectRootSync();

function isMatchedInFile(filePath, regexp) {
  const contents = fs.readFileSync(filePath, 'utf8');
  return !!contents.match(regexp);
}

/**
 * Checks if expo-modules-autolinking is setup on iOS
 */
function isExpoModulesInstalledIos(projectRoot) {
  const podfilePath = path.join(projectRoot, 'ios', 'Podfile');
  if (!fs.existsSync(podfilePath)) {
    // Assumes true for managed apps
    return true;
  }
  return isMatchedInFile(podfilePath, /use_expo_modules!/);
}

/**
 * Checks if expo-modules-autolinking is setup on Android
 */
function isExpoModulesInstalledAndroid(projectRoot) {
  const gradlePath = path.join(projectRoot, 'android', 'settings.gradle');
  if (!fs.existsSync(gradlePath)) {
    // Assumes true for managed apps
    return true;
  }
  return isMatchedInFile(gradlePath, /useExpoModules/);
}

module.exports = {
  dependency: {
    platforms: {
      // To make Expo CLI works on bare react-native projects without installing Expo Modules, we disable autolinking in this case.
      ios: !isExpoModulesInstalledIos(projectRoot) ? null : {},
      android: !isExpoModulesInstalledAndroid(projectRoot)
        ? null
        : {
            packageImportPath: 'import expo.modules.ExpoModulesPackage;',
          },
      macos: null,
      windows: null,
    },
  },
  // React Native SwiftPM autolinking plugin (preview). Discovered transitively by
  // `react-native spm` when `expo` is an autolinked dependency; contributes Expo's
  // native modules (precompiled xcframeworks + source packages) and the generated
  // ExpoModulesProvider into the SwiftPM autolinking graph.
  spm: {
    autolinkingPlugin: './scripts/spm/plugin.js',
  },
};
