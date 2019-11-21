# expo-ota

Provides Over The Air updates feature for your react-native app, highly customizable with out of the box support for Expo infrastructure based updates.

Supports Android and iOS platform.

# Installation

Make sure you have unimodules installed as described in [here](https://github.com/unimodules/react-native-unimodules/blob/master/README.md)

If you do, just type add `expo-ota` to you npm dependencies.

```bash
#Either with npm
npm add expo-ota

#Or yarn
yarn add expo-ota
```

# Basic configuration

OTA module requires some basic configuration in your app's native code. Please locate your `MainApplication.java` or `MainApplication.kt` for Android application, and `AppDelegate.m` for iOS.

## Android

Make sure following code is present in your `MainApplication.java`

```java
private ExpoOTA expoOTA;

    private final ReactNativeHost mReactNativeHost = new ReactNativeHost(this) {
        ...
        @Nullable
        @Override
        protected String getJSBundleFile() {
            if (!BuildConfig.DEBUG) {
                return expoOTA.getBundlePath();
            } else {
                return null;
            }
        }
        ...
    }

 @Override
    public void onCreate() {
        super.onCreate();
        SoLoader.init(this, /* native exopackage */ false);
        expoOTA = ExpoOTA.init(this, BuildConfig.DEBUG);
    }

```

## iOS

Make sure following code is present in your `AppDelegate.m`

```objc

@implementation AppDelegate {
  EXOta *ota;
}

- (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
{
#ifndef DEBUG
  ota = [EXOta new]; // This must be firs instruction within this method
#endif
  ...
}

- (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
#ifdef DEBUG
    return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
#else
  NSString *persistedBundle = [ota bundlePath];
  if(persistedBundle != nil)
  {
    return [NSURL fileURLWithPath:persistedBundle];
  } else
  {
    return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
  }
#endif
}
```

## app.json

You also need to create `app.json` file in root folder of your react-native application (alongside root `package.json`). If you've ejected from Expo, file should already be there. Example file looks like following:

```json
{
  "name": "OTA",
  "displayName": "expo-ota-template",
  "expo": {
    "name": "OTA Example",
    "slug": "expo-template-ota",
    "sdkVersion": "1.0.0",
    "version": "1.0.121",
    "entryPoint": "index.tsx",
    "releaseChannel": "channel", // optional
    "platforms": ["ios", "android"],
    "updates": {
      "enabled": true,
      "checkAutomatically": "ON_ERROR_RECOVERY", // optional
      "versionComparison": "NEWEST" // optional
    }
  }
}
```

- **slug** unique identifier for your project
- **sdkVersion** version of your native code. Bump it every time you or any of your dependencies make changes to native code
- **version** version of you React-Native app
- **checkAutomativcally** determines, whether updates should be downloaded automatically. `ON_ERROR_RECOVERY` disables auto updates, `ON_LOAD` enables it.
- **versionComparison** determines which algorithm should be used to decide, whether downloaded javascipt code should be used to replace current. Will be explained in details later.

# Expo-cli

Make sure you have `expo-cli` [installed and configured](https://docs.expo.io/versions/latest/workflow/expo-cli/) and that you are logged in.

Whenever you are buildng new native archives, make sure to predeed this with `expo publish`. You should include files it creates in your version control system. On iOS, make sure they are included in your app bundle.

## Publishing

The only command you will use from `expo-cli` is `expo publish`.
You MUST use it before building your release builds. Otherwise, they might crash on startup.

You can use it any time you want to publish new version of your javascript code.

# Advances configuration

Expo ota comes with multiple configuration options. Some of them are available via `app.json` fields, others require changes in native code.

## Release channels

One of the mose useful features of `expo-ota` are release channels.

When publishing your native application, you can decide which releaseChannel to use by setting proper field in your 'app.json' file before executing `expo publish`. The commant will make sure bundle is published to proper release channel.

## Upgrading algorithm

There are four versioning algorithms available in `expo-ota`, each described by other value of `versionComparison` field in `app.json`:

- **REVISION** Update if application is different than current
- **NEWEST** Update only if server provides version published after current version
- **VERSION** Update only if server provides application with newer `version` defined in `app.json`. Version are compared according to [**Semver 2.0**](https://semver.org/)
- **ANY** Always update

Updates happens only, if `sdkVersion` and `releaseChannel` of currently used and provided by server applications are equal.

# Automatic vs. manual

You can decide whether updates will be queried and downloaded automatically, according to configuration, or handle it manually.

## Automatic

If `checkAutomatically` value is set to `ON_LOAD` expo-ota takes care for updates on its own. On every startup of application it checks whether there is newer version of application available, downloads it of so, and makes sure new version is used on next startup.

## Manual

If `checkAutomatically` value is set to `ON_ERROR_RECOVERY` it will download update only in rare cases, leaving the decision whether to query for update entirely to you. However, you can still query for an update manually, even if automatic updates are enabled.

### API reference

For manually handling updates, there are several methods exposed to JavaScript by `expo-ota` module.
