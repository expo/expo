"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.importExpoModulesAutolinking = importExpoModulesAutolinking;

// NOTE: Keep these types in-sync with expo-modules-autolinking

/**
 * Imports the `expo-modules-autolinking` package installed in the project at the given path.
 */
function importExpoModulesAutolinking(projectRoot) {
  const autolinking = tryRequireExpoModulesAutolinking(projectRoot);
  assertAutolinkingCompatibility(autolinking);
  return autolinking;
}

function tryRequireExpoModulesAutolinking(projectRoot) {
  try {
    const resolvedAutolinkingPath = require.resolve('expo-modules-autolinking/build/autolinking', {
      paths: [projectRoot]
    });

    return require(resolvedAutolinkingPath);
  } catch {
    throw new Error("Cannot find 'expo-modules-autolinking' package in your project, make sure that you have 'expo' package installed");
  }
}

function assertAutolinkingCompatibility(autolinking) {
  if ('resolveSearchPathsAsync' in autolinking && 'findModulesAsync' in autolinking) {
    return;
  }

  throw new Error("The 'expo-modules-autolinking' package has been found, but it seems to be incompatible with '@expo/prebuild-config'");
}
//# sourceMappingURL=importExpoModulesAutolinking.js.map