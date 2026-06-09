"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addLaunchOptionsStorage = addLaunchOptionsStorage;
exports.removeInheritedProperties = removeInheritedProperties;
exports.removeWindowStartup = removeWindowStartup;
exports.setSceneManifest = setSceneManifest;
exports.withSceneDelegate = void 0;
function _XcodeProjectFile() {
  const data = require("./XcodeProjectFile");
  _XcodeProjectFile = function () {
    return data;
  };
  return data;
}
function _iosPlugins() {
  const data = require("../plugins/ios-plugins");
  _iosPlugins = function () {
    return data;
  };
  return data;
}
function _generateCode() {
  const data = require("../utils/generateCode");
  _generateCode = function () {
    return data;
  };
  return data;
}
const debug = require('debug')('expo:config-plugins:ios:scene-delegate');

// The scene delegate class is referenced from Info.plist by its fully qualified
// Swift name. `$(PRODUCT_MODULE_NAME)` resolves to the app target's module at build
// time, so the manifest stays correct regardless of the project name.
const SCENE_DELEGATE_CLASS_NAME = '$(PRODUCT_MODULE_NAME).SceneDelegate';
const SCENE_DELEGATE_FILE_NAME = 'SceneDelegate.swift';

// The window, React Native startup, and link forwarding all live in `ExpoSceneDelegate`,
// so the app's scene delegate is just a subclass and an extension point for config-plugins.
const SCENE_DELEGATE_CONTENTS = `internal import Expo

class SceneDelegate: ExpoSceneDelegate {
  // Extension point for config-plugins
}
`;

// `ExpoAppDelegate` now declares these stored properties, so a subclass redeclaring them
// is a compile error. Existing projects generated before the scene migration still have
// them, so the plugin strips the redeclarations.
const INHERITED_PROPERTY_MATCHERS = [/^[ \t]*var window: UIWindow\?\n/m, /^[ \t]*var reactNativeDelegate: ExpoReactNativeFactoryDelegate\?\n/m, /^[ \t]*var reactNativeFactory: RCTReactNativeFactory\?\n/m];

/**
 * Adopts the UIKit scene-based life cycle in the iOS project.
 *
 * The iOS SDK shipped with Xcode 27 requires apps to use the UIScene life cycle
 * (Apple Technote TN3187); a window-based app delegate is stopped at launch. This
 * plugin adds a `UIApplicationSceneManifest` to the Info.plist, generates a
 * `SceneDelegate.swift` subclassing `ExpoSceneDelegate`, and updates the
 * `AppDelegate.swift` to stop owning the window so React Native starts in the scene.
 */
const withSceneDelegate = config => {
  config = withSceneManifest(config);
  config = withSceneDelegateFile(config);
  config = withSceneDelegateAppDelegate(config);
  return config;
};
exports.withSceneDelegate = withSceneDelegate;
const withSceneManifest = config => {
  return (0, _iosPlugins().withInfoPlist)(config, config => {
    config.modResults = setSceneManifest(config.modResults);
    return config;
  });
};
function setSceneManifest(infoPlist) {
  // Respect a manifest the user already configured (e.g. a multi-scene or
  // multi-window app); only fill in a default single-scene configuration.
  if (infoPlist.UIApplicationSceneManifest) {
    return infoPlist;
  }
  return {
    ...infoPlist,
    UIApplicationSceneManifest: {
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [{
          UISceneConfigurationName: 'Default Configuration',
          UISceneDelegateClassName: SCENE_DELEGATE_CLASS_NAME
        }]
      }
    }
  };
}
const withSceneDelegateFile = config => {
  return (0, _XcodeProjectFile().withBuildSourceFile)(config, {
    filePath: SCENE_DELEGATE_FILE_NAME,
    contents: SCENE_DELEGATE_CONTENTS
  });
};
const withSceneDelegateAppDelegate = config => {
  return (0, _iosPlugins().withAppDelegate)(config, config => {
    if (config.modResults.language !== 'swift') {
      debug('Skipping scene life cycle setup: AppDelegate is not Swift.');
      return config;
    }
    config.modResults.contents = removeInheritedProperties(config.modResults.contents);
    config.modResults.contents = removeWindowStartup(config.modResults.contents).contents;
    config.modResults.contents = addLaunchOptionsStorage(config.modResults.contents).contents;
    return config;
  });
};

/**
 * Removes redeclarations of stored properties that `ExpoAppDelegate` now owns. Leaving them
 * in place is a "cannot override with a stored property" compile error.
 */
function removeInheritedProperties(src) {
  return INHERITED_PROPERTY_MATCHERS.reduce((contents, matcher) => {
    return contents.replace(matcher, '');
  }, src);
}

/**
 * Comments out the window creation and React Native startup that the legacy
 * template ran inside `didFinishLaunchingWithOptions`. With the scene life cycle the
 * window is owned by `ExpoSceneDelegate`, so leaving this in place would create a
 * second, detached window.
 */
function removeWindowStartup(src) {
  // Match the optionally `#if os(iOS) || os(tvOS)`-guarded window + startReactNative
  // block. The leading anchor requires `window = UIWindow(` to start a line (after
  // indentation only), so an already-commented block won't match again.
  const blockMatcher = /(?:^[ \t]*#if os\(iOS\)[^\n]*\n)?^([ \t]*)window = UIWindow\([\s\S]*?launchOptions: launchOptions\)\n(?:^[ \t]*#endif\n)?/m;
  if (!blockMatcher.test(src)) {
    // Already migrated (or a non-template app delegate). Treat as a no-op so the
    // plugin stays idempotent rather than failing the whole prebuild.
    return {
      contents: src,
      didMerge: false,
      didClear: false
    };
  }
  const contents = src.replace(blockMatcher, (match, indent) => {
    const commented = match.replace(/\n$/, '').split('\n').map(line => line.length ? `// ${line}` : line).join('\n');
    return `${indent}// React Native is now started in SceneDelegate.swift.\n${commented}\n`;
  });
  return {
    contents,
    didMerge: true,
    didClear: false
  };
}

/**
 * Stores `launchOptions` on the app delegate so `ExpoSceneDelegate` can start React Native
 * with the same options the app launched with.
 */
function addLaunchOptionsStorage(src) {
  // The template already stores launchOptions; only inject it into projects that don't.
  if (/self\.launchOptions = launchOptions/.test(src)) {
    return {
      contents: src,
      didMerge: false,
      didClear: false
    };
  }
  return (0, _generateCode().mergeContents)({
    tag: 'expo-scene-launch-options',
    src,
    newSrc: '    self.launchOptions = launchOptions',
    // Place it next to where the factory is stored, before returning from didFinishLaunching.
    anchor: /reactNativeFactory = factory/,
    offset: 1,
    comment: '//'
  });
}
//# sourceMappingURL=SceneDelegate.js.map