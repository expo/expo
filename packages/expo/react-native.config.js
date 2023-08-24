const findProjectRoot = require('@react-native-community/cli-tools').findProjectRoot;
const fs = require('fs');
const path = require('path');

const projectRoot = findProjectRoot();

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
  return isMatchedInFile(
    podfilePath,
    /^\s*require File.join\(File\.dirname\(`node --print "require\.resolve\('expo\/package\.json'\)"`\), "scripts\/autolinking"\)\s*$/m
  );
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
  return isMatchedInFile(
    gradlePath,
    /^\s*apply from: (new File|file)\(\["node", "--print", "require\.resolve\('expo\/package.json'\)"\]\.execute\(null, rootDir\)\.text\.trim\(\), "\.\.\/scripts\/autolinking\.gradle"\);?\s*$/m
  );
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
};
