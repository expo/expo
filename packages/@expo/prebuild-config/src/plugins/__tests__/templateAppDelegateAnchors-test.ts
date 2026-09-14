import fs from 'fs';
import path from 'path';

const TEMPLATE_APP_DELEGATE = path.join(
  __dirname,
  '../../../../../..',
  'templates/expo-template-bare-minimum/ios/HelloWorld/AppDelegate.swift'
);

/**
 * Ecosystem config plugins codemod `AppDelegate.swift` by matching text in it. Those anchors are
 * a contract with the ecosystem even though they are not a declared API: when the template stops
 * containing a line a published plugin looks for, the plugin silently stops injecting its code —
 * prebuild still succeeds and the app still compiles. See https://github.com/expo/expo/pull/46734.
 *
 * Anchors are copied verbatim from the published plugin. AppsFlyer's are exact substrings, so
 * indentation and line breaks are part of the contract.
 */
const ECOSYSTEM_ANCHORS: { plugin: string; what: string; anchor: RegExp | string }[] = [
  {
    plugin: '@react-native-firebase/app@26.4.0',
    what: 'FirebaseApp.configure()',
    anchor: /(?:self\.moduleName\s*=\s*"([^"]*)")|(?:factory\.startReactNative\()/,
  },
  {
    plugin: 'react-native-appsflyer@7.0.2',
    what: 'handleLaunchOptions()',
    anchor: `  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {`,
  },
  {
    plugin: 'react-native-appsflyer@7.0.2',
    what: 'handleOpen(url:options:)',
    anchor: `  public override func application(
    _ app: UIApplication,
    open url: URL,
    options: [UIApplication.OpenURLOptionsKey: Any] = [:]
  ) -> Bool {`,
  },
  {
    plugin: 'react-native-appsflyer@7.0.2',
    what: 'continueUserActivity()',
    anchor: `  public override func application(
    _ application: UIApplication,
    continue userActivity: NSUserActivity,
    restorationHandler: @escaping ([UIUserActivityRestoring]?) -> Void
  ) -> Bool {`,
  },
  {
    // This anchor matches any `func application(...) -> Bool {`, so the Linking overload alone
    // keeps it green — the rows that would catch the loss of the didFinishLaunching declaration
    // are appsflyer's `handleLaunchOptions()` and intercom's `IntercomModule.initialize()`, which
    // hold it verbatim. Kept as published rather than tightened.
    plugin: '@sentry/react-native@8.26.0',
    what: 'SentrySDK.start()',
    anchor: /(func application\([^)]*\) -> Bool \{)\s*\n(\s*)/s,
  },
  {
    plugin: 'react-native-maps@1.29.2',
    what: 'import GoogleMaps',
    anchor: /(@main|@UIApplicationMain)/,
  },
  {
    plugin: 'react-native-maps@1.29.2',
    what: 'GMSServices.provideAPIKey()',
    anchor: /\bsuper\.application\(\w+?, didFinishLaunchingWithOptions: \w+?\)/,
  },
  {
    plugin: 'react-native-google-cast@4.9.1',
    what: 'GCKCastContext.setSharedInstanceWith()',
    anchor: /let\s+delegate\s*=\s*ReactNativeDelegate\(\)/,
  },
  {
    plugin: 'react-native-bootsplash@7.3.2',
    what: 'RNBootSplash.initWithStoryboard()',
    anchor: 'class ReactNativeDelegate: ExpoReactNativeFactoryDelegate {',
  },
  {
    plugin: '@intercom/intercom-react-native@10.7.1',
    what: 'import intercom_react_native',
    anchor: /import Expo/,
  },
  {
    // Intercom passes the selector `application(_:didFinishLaunchingWithOptions:)` to
    // `insertContentsInsideSwiftFunctionBlock`, which resolves it to this declaration. The selector
    // is not text in the template, so the declaration it resolves to is the anchor.
    plugin: '@intercom/intercom-react-native@10.7.1',
    what: 'IntercomModule.initialize()',
    anchor: `  public override func application(
    _ application: UIApplication,
    didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]? = nil
  ) -> Bool {`,
  },
  {
    // No published plugin anchors on this line alone — @react-native-firebase/app only reaches it
    // through an alternation that also matches `factory.startReactNative(`, so deleting the window
    // would leave every row above still passing.
    plugin: 'the template itself',
    what: 'the root UIWindow the plugins above assume',
    anchor: 'window = UIWindow(frame:',
  },
];

describe('bare template AppDelegate.swift', () => {
  const contents = fs.readFileSync(TEMPLATE_APP_DELEGATE, 'utf8');

  it.each(ECOSYSTEM_ANCHORS)('keeps the anchor $plugin uses to inject $what', ({ anchor }) => {
    if (typeof anchor === 'string') {
      expect(contents).toContain(anchor);
    } else {
      expect(contents).toMatch(anchor);
    }
  });
});
