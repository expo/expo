"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.addLaunchOptionsProperty = addLaunchOptionsProperty;
exports.addSceneConfigurationMethod = addSceneConfigurationMethod;
exports.removeWindowStartup = removeWindowStartup;
exports.setSceneManifest = setSceneManifest;
exports.withSceneDelegate = void 0;
function _path() {
  const data = _interopRequireDefault(require("path"));
  _path = function () {
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
function _XcodeProjectFile() {
  const data = require("./XcodeProjectFile");
  _XcodeProjectFile = function () {
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
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const debug = require('debug')('expo:config-plugins:ios:scene-delegate');

// The scene delegate class is referenced from Info.plist by its fully qualified
// Swift name. `$(PRODUCT_MODULE_NAME)` resolves to the app target's module at build
// time, so the manifest stays correct regardless of the project name.
const SCENE_DELEGATE_CLASS_NAME = '$(PRODUCT_MODULE_NAME).SceneDelegate';
const SCENE_DELEGATE_FILE_NAME = 'SceneDelegate.swift';
const SCENE_DELEGATE_CONTENTS = `internal import Expo
import React
import ReactAppDependencyProvider

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
  var window: UIWindow?

  func scene(
    _ scene: UIScene,
    willConnectTo session: UISceneSession,
    options connectionOptions: UIScene.ConnectionOptions
  ) {
    guard let windowScene = scene as? UIWindowScene else {
      return
    }
    guard let appDelegate = UIApplication.shared.delegate as? AppDelegate,
          let factory = appDelegate.reactNativeFactory else {
      return
    }

    let window = UIWindow(windowScene: windowScene)
    self.window = window
    appDelegate.window = window

    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: appDelegate.launchOptions)

    // Deliver any links that opened the app to React Native, since UIScene
    // routes them here instead of to the app delegate.
    if let userActivity = connectionOptions.userActivities.first {
      RCTLinkingManager.application(
        UIApplication.shared,
        continue: userActivity,
        restorationHandler: { _ in })
    }
    if let urlContext = connectionOptions.urlContexts.first {
      RCTLinkingManager.application(
        UIApplication.shared,
        open: urlContext.url,
        options: [:])
    }
  }

  // Linking API
  func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
    guard let urlContext = URLContexts.first else {
      return
    }
    RCTLinkingManager.application(
      UIApplication.shared,
      open: urlContext.url,
      options: [:])
  }

  // Universal Links
  func scene(_ scene: UIScene, continue userActivity: NSUserActivity) {
    RCTLinkingManager.application(
      UIApplication.shared,
      continue: userActivity,
      restorationHandler: { _ in })
  }
}
`;

/**
 * Adopts the UIKit scene-based life cycle in the iOS project.
 *
 * The iOS SDK shipped with Xcode 27 requires apps to use the UIScene life cycle
 * (Apple Technote TN3187); a window-based app delegate is stopped at launch. This
 * plugin adds a `UIApplicationSceneManifest` to the Info.plist, generates a
 * `SceneDelegate.swift`, and updates the `AppDelegate.swift` to vend the scene
 * configuration and move React Native startup into the scene delegate.
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
    const fileName = _path().default.basename(config.modResults.path);
    try {
      config.modResults.contents = removeWindowStartup(config.modResults.contents).contents;
      config.modResults.contents = addLaunchOptionsProperty(config.modResults.contents).contents;
      config.modResults.contents = addSceneConfigurationMethod(config.modResults.contents).contents;
    } catch (error) {
      if (error.code === 'ERR_NO_MATCH') {
        throw new Error(`Cannot adopt the UIScene life cycle in ${fileName}: the app delegate doesn't ` + `match the expected template. Migrate it manually following Apple Technote TN3187.`);
      }
      throw error;
    }
    return config;
  });
};

/**
 * Comments out the window creation and React Native startup that the legacy
 * template ran inside `didFinishLaunchingWithOptions`. With the scene life cycle
 * the window is owned by the scene delegate, so leaving this in place would create
 * a second, detached window.
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
 * Adds a stored `launchOptions` so the scene delegate can start React Native with
 * the same options the app was launched with.
 */
function addLaunchOptionsProperty(src) {
  return (0, _generateCode().mergeContents)({
    tag: 'expo-scene-launch-options',
    src,
    newSrc: '  var launchOptions: [UIApplication.LaunchOptionsKey: Any]?',
    anchor: /var reactNativeFactory: RCTReactNativeFactory\?/,
    offset: 1,
    comment: '//'
  });
}

/**
 * Adds the scene-configuration method that points UIKit at `SceneDelegate`.
 */
function addSceneConfigurationMethod(src) {
  const newSrc = ['  public override func application(', '    _ application: UIApplication,', '    configurationForConnectingSceneSession connectingSceneSession: UISceneSession,', '    options: UIScene.ConnectionOptions', '  ) -> UISceneConfiguration {', '    let configuration = UISceneConfiguration(', '      name: nil,', '      sessionRole: connectingSceneSession.role)', '    configuration.delegateClass = SceneDelegate.self', '    return configuration', '  }'];
  return (0, _generateCode().mergeContents)({
    tag: 'expo-scene-configuration',
    src,
    newSrc: newSrc.join('\n'),
    // Insert right after the app delegate stashes the factory and launch options.
    anchor: /return super\.application\(application, didFinishLaunchingWithOptions: launchOptions\)/,
    offset: 2,
    comment: '//'
  });
}
//# sourceMappingURL=SceneDelegate.js.map