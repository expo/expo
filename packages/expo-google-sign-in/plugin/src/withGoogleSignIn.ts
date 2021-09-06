import {
  ConfigPlugin,
  createRunOncePlugin,
  withXcodeProject,
  XcodeProject,
} from '@expo/config-plugins';

const pkg = require('expo-google-sign-in/package.json');

/**
 * Exclude building for arm64 on simulator devices in the pbxproj project.
 * Without this, production builds targeting simulators will fail.
 */
export function setExcludedArchitectures(project: XcodeProject): XcodeProject {
  const configurations = project.pbxXCBuildConfigurationSection();
  // @ts-ignore
  for (const { buildSettings } of Object.values(configurations || {})) {
    // Guessing that this is the best way to emulate Xcode.
    // Using `project.addToBuildSettings` modifies too many targets.
    if (typeof buildSettings?.PRODUCT_NAME !== 'undefined') {
      buildSettings['"EXCLUDED_ARCHS[sdk=iphonesimulator*]"'] = '"arm64"';
    }
  }

  return project;
}

const withExcludedSimulatorArchitectures: ConfigPlugin = (c) => {
  return withXcodeProject(c, (config) => {
    config.modResults = setExcludedArchitectures(config.modResults);
    return config;
  });
};

const withGoogleSignIn: ConfigPlugin = (config) => {
  return withExcludedSimulatorArchitectures(config);
};

export default createRunOncePlugin(withGoogleSignIn, pkg.name, pkg.version);
