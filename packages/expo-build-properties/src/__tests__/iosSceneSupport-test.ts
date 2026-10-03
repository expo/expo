import type { ExpoConfig } from 'expo/config';
import { WarningAggregator, withAppDelegate, withInfoPlist } from 'expo/config-plugins';
import fs from 'fs';
import path from 'path';
import resolveFrom from 'resolve-from';

import { withIosSceneSupport } from '../iosSceneSupport';

jest.mock('resolve-from', () => {
  const actual = jest.requireActual('resolve-from');
  return Object.assign(jest.fn(actual), { silent: jest.fn(actual.silent) });
});

jest.mock('expo/config-plugins', () => {
  const plugins = jest.requireActual('expo/config-plugins');
  return {
    ...plugins,
    WarningAggregator: { addWarningIOS: jest.fn() },
    withAppDelegate: jest.fn().mockImplementation((config) => config),
    withInfoPlist: jest.fn().mockImplementation((config) => config),
  };
});

const WRAPPED_STARTUP = `#if os(iOS) || os(tvOS)
    window = UIWindow(frame: UIScreen.main.bounds)
    factory.startReactNative(
      withModuleName: "main",
      in: window,
      launchOptions: launchOptions)
#endif
`;

/** The published Expo SDK 57 bare template AppDelegate. */
const LEGACY_APP_DELEGATE = fs.readFileSync(
  path.join(__dirname, 'fixtures/sdk57-AppDelegate.swift'),
  'utf8'
);

/** An earlier SDK 57 template revision without the `#if os(iOS) || os(tvOS)` wrapper. */
const LEGACY_APP_DELEGATE_UNWRAPPED = LEGACY_APP_DELEGATE.replace(
  WRAPPED_STARTUP,
  WRAPPED_STARTUP.split('\n').slice(1, -2).join('\n') + '\n'
);

const SCENE_APP_DELEGATE = LEGACY_APP_DELEGATE.replace(
  'class AppDelegate: ExpoAppDelegate {',
  'class AppDelegate: ExpoAppDelegate, ExpoReactNativeFactoryProvider {'
).replace(`\n${WRAPPED_STARTUP}`, '');

const FIREBASE_LINES = `    // @generated begin @react-native-firebase/app-didFinishLaunchingWithOptions - expo prebuild (DO NOT MODIFY) sync-1
    FirebaseApp.configure()
    // @generated end @react-native-firebase/app-didFinishLaunchingWithOptions
`;

const SCENE_MANIFEST = {
  UIApplicationSupportsMultipleScenes: false,
  UISceneConfigurations: {
    UIWindowSceneSessionRoleApplication: [
      {
        UISceneConfigurationName: 'Default Configuration',
        UISceneDelegateClassName: 'EXExpoAppSceneDelegate',
      },
    ],
  },
};

const BASE_INFO_PLIST = { CFBundleDisplayName: 'HelloWorld' };

function makeConfig(sdkVersion?: string): ExpoConfig {
  return { name: 'HelloWorld', slug: 'hello-world', sdkVersion };
}

/**
 * Feed the mocked `withAppDelegate` and `withInfoPlist` mods with the given inputs and
 * capture the mod results the plugin produced for each.
 */
function mockIosMods({
  appDelegate,
  infoPlist,
  language = 'swift',
}: {
  appDelegate: string;
  infoPlist: Record<string, unknown>;
  language?: string;
}) {
  const results: { appDelegate?: string; infoPlist?: Record<string, unknown> } = {};

  (withAppDelegate as jest.Mock).mockImplementationOnce((config, action) => {
    const next = action({
      ...config,
      modResults: { path: 'ios/HelloWorld/AppDelegate.swift', language, contents: appDelegate },
    });
    results.appDelegate = next.modResults.contents;
    return next;
  });
  (withInfoPlist as jest.Mock).mockImplementationOnce((config, action) => {
    const next = action({ ...config, modResults: { ...infoPlist } });
    results.infoPlist = next.modResults;
    return next;
  });

  return results;
}

describe(withIosSceneSupport, () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('does nothing when enableSceneSupport is not set', () => {
    const config = makeConfig('57.0.23');

    expect(withIosSceneSupport(config, {})).toBe(config);
    expect(withIosSceneSupport(config, { ios: {} })).toBe(config);

    expect(withAppDelegate).not.toHaveBeenCalled();
    expect(withInfoPlist).not.toHaveBeenCalled();
    expect(WarningAggregator.addWarningIOS).not.toHaveBeenCalled();
  });

  it('adopts the scene lifecycle in AppDelegate.swift and Info.plist on SDK 57', () => {
    const results = mockIosMods({ appDelegate: LEGACY_APP_DELEGATE, infoPlist: BASE_INFO_PLIST });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } });

    expect(results.appDelegate).toBe(SCENE_APP_DELEGATE);
    expect(results.infoPlist).toEqual({
      ...BASE_INFO_PLIST,
      UIApplicationSceneManifest: SCENE_MANIFEST,
    });
  });

  it('adopts the scene lifecycle in an AppDelegate without the os() wrapper', () => {
    const results = mockIosMods({
      appDelegate: LEGACY_APP_DELEGATE_UNWRAPPED,
      infoPlist: BASE_INFO_PLIST,
    });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } });

    expect(results.appDelegate).toBe(SCENE_APP_DELEGATE);
  });

  it('keeps lines another plugin inserted inside the startup block', () => {
    const appDelegate = LEGACY_APP_DELEGATE.replace(
      '    factory.startReactNative(',
      `${FIREBASE_LINES}    factory.startReactNative(`
    );
    const results = mockIosMods({ appDelegate, infoPlist: BASE_INFO_PLIST });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } });

    expect(results.appDelegate).toBe(
      SCENE_APP_DELEGATE.replace(
        '    reactNativeFactory = factory\n\n',
        `    reactNativeFactory = factory\n\n#if os(iOS) || os(tvOS)\n${FIREBASE_LINES}#endif\n\n`
      )
    );
  });

  it('keeps inserted lines in an AppDelegate without the os() wrapper', () => {
    const appDelegate = LEGACY_APP_DELEGATE_UNWRAPPED.replace(
      '    factory.startReactNative(',
      `${FIREBASE_LINES}    factory.startReactNative(`
    );
    const results = mockIosMods({ appDelegate, infoPlist: BASE_INFO_PLIST });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } });

    expect(results.appDelegate).toBe(
      SCENE_APP_DELEGATE.replace(
        '    reactNativeFactory = factory\n\n',
        `    reactNativeFactory = factory\n\n${FIREBASE_LINES}\n`
      )
    );
  });

  it('keeps a line another plugin inserted above the startup block', () => {
    const appDelegate = LEGACY_APP_DELEGATE.replace(
      '\n#if os(iOS) || os(tvOS)',
      '\n    FirebaseApp.configure()\n#if os(iOS) || os(tvOS)'
    );
    const results = mockIosMods({ appDelegate, infoPlist: BASE_INFO_PLIST });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } });

    expect(results.appDelegate).toBe(
      SCENE_APP_DELEGATE.replace(
        '    reactNativeFactory = factory\n\n',
        '    reactNativeFactory = factory\n\n    FirebaseApp.configure()\n\n'
      )
    );
  });

  it('leaves an already adopted project unchanged when enabled', () => {
    const results = mockIosMods({
      appDelegate: SCENE_APP_DELEGATE,
      infoPlist: { ...BASE_INFO_PLIST, UIApplicationSceneManifest: SCENE_MANIFEST },
    });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } });

    expect(results.appDelegate).toBe(SCENE_APP_DELEGATE);
    expect(results.infoPlist).toEqual({
      ...BASE_INFO_PLIST,
      UIApplicationSceneManifest: SCENE_MANIFEST,
    });
  });

  it('restores the legacy lifecycle when set to false', () => {
    const results = mockIosMods({
      appDelegate: SCENE_APP_DELEGATE,
      infoPlist: { ...BASE_INFO_PLIST, UIApplicationSceneManifest: SCENE_MANIFEST },
    });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: false } });

    expect(results.appDelegate).toBe(LEGACY_APP_DELEGATE);
    expect(results.infoPlist).toEqual(BASE_INFO_PLIST);
  });

  it('restores the startup statements around lines another plugin inserted', () => {
    const appDelegate = LEGACY_APP_DELEGATE.replace(
      '    factory.startReactNative(',
      `${FIREBASE_LINES}    factory.startReactNative(`
    );
    const enabled = mockIosMods({ appDelegate, infoPlist: BASE_INFO_PLIST });
    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } });

    const results = mockIosMods({
      appDelegate: enabled.appDelegate!,
      infoPlist: { ...BASE_INFO_PLIST, UIApplicationSceneManifest: SCENE_MANIFEST },
    });
    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: false } });

    expect(results.appDelegate).toBe(appDelegate);
  });

  it('keeps a scene manifest the app owns when set to false', () => {
    const appManifest = { UIApplicationSupportsMultipleScenes: true };
    const results = mockIosMods({
      appDelegate: LEGACY_APP_DELEGATE,
      infoPlist: { ...BASE_INFO_PLIST, UIApplicationSceneManifest: appManifest },
    });

    withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: false } });

    expect(results.appDelegate).toBe(LEGACY_APP_DELEGATE);
    expect(results.infoPlist).toEqual({
      ...BASE_INFO_PLIST,
      UIApplicationSceneManifest: appManifest,
    });
  });

  it('throws when the app already declares its own scene manifest', () => {
    mockIosMods({
      appDelegate: LEGACY_APP_DELEGATE,
      infoPlist: {
        ...BASE_INFO_PLIST,
        UIApplicationSceneManifest: { UIApplicationSupportsMultipleScenes: true },
      },
    });

    expect(() =>
      withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } })
    ).toThrow(/UIApplicationSceneManifest/);
  });

  it('throws when the AppDelegate is not the standard SDK 57 Swift template', () => {
    mockIosMods({
      appDelegate: 'class AppDelegate: UIResponder {}',
      infoPlist: BASE_INFO_PLIST,
    });
    expect(() =>
      withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } })
    ).toThrow(/Swift AppDelegate/);

    mockIosMods({
      appDelegate: '@implementation AppDelegate',
      infoPlist: BASE_INFO_PLIST,
      language: 'objcpp',
    });
    expect(() =>
      withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } })
    ).toThrow(/Swift AppDelegate/);
  });

  it('throws when the startup block is missing a statement', () => {
    mockIosMods({
      appDelegate: LEGACY_APP_DELEGATE.replace(
        '    window = UIWindow(frame: UIScreen.main.bounds)\n',
        ''
      ),
      infoPlist: BASE_INFO_PLIST,
    });

    expect(() =>
      withIosSceneSupport(makeConfig('57.0.23'), { ios: { enableSceneSupport: true } })
    ).toThrow(/Swift AppDelegate/);
  });

  it('throws on SDK 57 patches before the scene runtime backport', () => {
    expect(() =>
      withIosSceneSupport(makeConfig('57.0.22'), { ios: { enableSceneSupport: true } })
    ).toThrow(/57\.0\.23/);
    expect(() =>
      withIosSceneSupport(makeConfig(undefined), { ios: { enableSceneSupport: true } })
    ).toThrow(/57\.0\.23/);
    expect(withAppDelegate).not.toHaveBeenCalled();
  });

  it('reads the installed expo version from the project root', () => {
    // `config.sdkVersion` only carries the major version (e.g. "57.0.0"), so the patch check
    // must use the version of the `expo` package installed in the project.
    (resolveFrom.silent as jest.Mock).mockReturnValueOnce(
      path.join(__dirname, 'fixtures/expo-57.0.23-package.json')
    );
    const results = mockIosMods({ appDelegate: LEGACY_APP_DELEGATE, infoPlist: BASE_INFO_PLIST });

    withIosSceneSupport(
      { ...makeConfig('57.0.0'), _internal: { projectRoot: '/app' } },
      { ios: { enableSceneSupport: true } }
    );

    expect(resolveFrom.silent).toHaveBeenCalledWith('/app', 'expo/package.json');
    expect(results.appDelegate).toBe(SCENE_APP_DELEGATE);
  });

  it('falls back to config.sdkVersion when expo cannot be resolved from the project root', () => {
    (resolveFrom.silent as jest.Mock).mockReturnValueOnce(undefined);

    expect(() =>
      withIosSceneSupport(
        { ...makeConfig('57.0.0'), _internal: { projectRoot: '/app' } },
        { ios: { enableSceneSupport: true } }
      )
    ).toThrow(/57\.0\.23/);
  });

  it('treats SDK 58 prereleases as having native scene support', () => {
    const config = makeConfig('58.0.0-preview.1');

    expect(withIosSceneSupport(config, { ios: { enableSceneSupport: true } })).toBe(config);

    expect(withAppDelegate).not.toHaveBeenCalled();
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledTimes(1);
  });

  it('warns and does nothing on SDK 58 and newer', () => {
    const config = makeConfig('58.0.0');

    expect(withIosSceneSupport(config, { ios: { enableSceneSupport: true } })).toBe(config);

    expect(withAppDelegate).not.toHaveBeenCalled();
    expect(withInfoPlist).not.toHaveBeenCalled();
    expect(WarningAggregator.addWarningIOS).toHaveBeenCalledWith(
      'ios.enableSceneSupport',
      expect.stringMatching(/no longer required.*can be removed/)
    );
  });
});
