import {
  addLaunchOptionsStorage,
  removeInheritedProperties,
  removeWindowStartup,
  setSceneManifest,
} from '../SceneDelegate';

// The template app delegate as generated before the scene migration.
const LEGACY_APP_DELEGATE = `internal import Expo
import React
import ReactAppDependencyProvider

@main
class AppDelegate: ExpoAppDelegate {
  var window: UIWindow?

  var reactNativeDelegate: ExpoReactNativeFactoryDelegate?
  var reactNativeFactory: RCTReactNativeFactory?

  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {
    let delegate = ReactNativeDelegate()
    let factory = ExpoReactNativeFactory(delegate: delegate)
    delegate.dependencyProvider = RCTAppDependencyProvider()

    reactNativeDelegate = delegate
    reactNativeFactory = factory

#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif

    return super.application(application, didFinishLaunchingWithOptions: launchOptions)
  }
}
`;

describe(setSceneManifest, () => {
  it(`adds a default single-scene manifest`, () => {
    const result = setSceneManifest({});
    expect(result.UIApplicationSceneManifest).toEqual({
      UIApplicationSupportsMultipleScenes: false,
      UISceneConfigurations: {
        UIWindowSceneSessionRoleApplication: [
          {
            UISceneConfigurationName: 'Default Configuration',
            UISceneDelegateClassName: '$(PRODUCT_MODULE_NAME).SceneDelegate',
          },
        ],
      },
    });
  });

  it(`leaves an existing manifest untouched`, () => {
    const existing = { UIApplicationSceneManifest: { UIApplicationSupportsMultipleScenes: true } };
    expect(setSceneManifest({ ...existing })).toEqual(existing);
  });
});

describe(removeInheritedProperties, () => {
  it(`removes properties now declared by ExpoAppDelegate`, () => {
    const result = removeInheritedProperties(LEGACY_APP_DELEGATE);
    expect(result).not.toMatch(/var window: UIWindow\?/);
    expect(result).not.toMatch(/var reactNativeDelegate: ExpoReactNativeFactoryDelegate\?/);
    expect(result).not.toMatch(/var reactNativeFactory: RCTReactNativeFactory\?/);
  });

  it(`is idempotent`, () => {
    const once = removeInheritedProperties(LEGACY_APP_DELEGATE);
    expect(removeInheritedProperties(once)).toBe(once);
  });
});

describe(removeWindowStartup, () => {
  it(`comments out the window + startReactNative block`, () => {
    const result = removeWindowStartup(LEGACY_APP_DELEGATE);
    expect(result.didMerge).toBe(true);
    expect(result.contents).toContain('//     window = UIWindow(frame: UIScreen.main.bounds)\n');
    expect(result.contents).not.toMatch(/^[ \t]*window = UIWindow\(frame/m);
    expect(result.contents).toContain('// React Native is now started in SceneDelegate.swift.');
    expect(result.contents).toMatchSnapshot();
  });

  it(`is a no-op when there is no window startup to remove`, () => {
    const already = removeWindowStartup(LEGACY_APP_DELEGATE).contents;
    const result = removeWindowStartup(already);
    expect(result.didMerge).toBe(false);
    expect(result.contents).toBe(already);
  });
});

describe(addLaunchOptionsStorage, () => {
  it(`stores launchOptions for the scene delegate`, () => {
    const result = addLaunchOptionsStorage(LEGACY_APP_DELEGATE);
    expect(result.didMerge).toBe(true);
    expect(result.contents).toContain('self.launchOptions = launchOptions');
  });

  it(`is idempotent`, () => {
    const once = addLaunchOptionsStorage(LEGACY_APP_DELEGATE).contents;
    const twice = addLaunchOptionsStorage(once);
    expect(twice.didMerge).toBe(false);
    expect(twice.contents).toBe(once);
  });
});

describe('full app delegate migration', () => {
  it(`produces a scene-based app delegate`, () => {
    let contents = removeInheritedProperties(LEGACY_APP_DELEGATE);
    contents = removeWindowStartup(contents).contents;
    contents = addLaunchOptionsStorage(contents).contents;
    expect(contents).toMatchSnapshot();
  });
});
