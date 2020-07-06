# expo-updates

`expo-updates` fetches and manages updates to your app stored on a remote server.

## API documentation

- [Documentation for the master branch](https://github.com/expo/expo/blob/master/docs/pages/versions/unversioned/sdk/updates.md)
- [Documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/updates/)

Additionally, for an introduction to this module and tooling around OTA updates, you can watch [this talk](https://www.youtube.com/watch?v=Si909la3rLk) by [@esamelson](https://github.com/esamelson) from ReactEurope 2020.

## Compatibility

This module requires `expo-cli@3.17.6` or later; make sure your global installation is at least this version before proceeding.

Additionally, this module is only compatible with Expo SDK 37 or later. For bare workflow projects, if the `expo` package is installed, it must be version `37.0.2` or later.

Finally, this module is not compatible with ExpoKit. Make sure you do not have `expokit` listed as a dependency in package.json before adding this module.

## Upgrading

If you're upgrading from `expo-updates@0.1.x`, you can opt into the **no-publish workflow**. In this workflow, release builds of both iOS and Android apps will create and embed a new update at build-time from the JS code currently on disk, rather than embedding a copy of the most recently published update. For instructions and more information, see the [CHANGELOG](https://github.com/expo/expo/blob/master/packages/expo-updates/CHANGELOG.md). (For new projects, the no-publish workflow is enabled by default.)

# Installation in managed Expo projects

For managed [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/media-library/).

# Installation in bare React Native projects

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-updates
```

### `expo-asset`

(If you have the `expo` package installed in your project already and use `registerRootComponent` in your project entry point, you can skip this section!)

If you have assets (such as images or other media) that are `require`d in your application code, and you'd like these to be included in updates, you'll also need to install the `expo-asset` helper package:

```
expo install expo-asset
```

Additionally, add the following line in your root `index.js` or `App.js` file:

```js
import 'expo-asset';
```

### metro.config.js

You need to add a metro.config.js to your project with the following contents:

```js
module.exports = {
  transformer: {
    assetPlugins: ['expo-asset/tools/hashAssetFiles'],
  },
};
```

### Set up app.json

If you're going to be using Expo CLI to package your updates (either with `expo export` or `expo publish`), you will need to add some fields to your app.json. If not, you can skip this section.

First, if your app.json file does not yet include an `expo` key, add it with the following fields:

```json
  "expo": {
    "name": "<your app name -- must match your iOS project folder name>",
    "slug": "<string that uniquely identifies your app>",
    "privacy": "unlisted",
    "sdkVersion": "<SDK version of your app. See note below>",
  }
```

Currently, all apps published to Expo's servers must be configured with a valid SDK version. We use the SDK version to determine which app binaries a particular update is compatible with. If your app has the `expo` package installed in package.json, your SDK version should match the major version number of this package. Otherwise, you can just use the latest Expo SDK version number (at least `37.0.0`).

If you installed `expo-asset` and have other assets (such as images or other media) that are imported in your application code, and you would like these to be downloaded atomically as part of an update, add the `assetBundlePatterns` field under the `expo` key in your project's app.json. This field should be an array of file glob strings which point to the assets you want bundled. For example:

```json
  "assetBundlePatterns": ["**/*"],
```

Finally, if you're migrating from an ExpoKit project to the bare workflow with `expo-updates`, remove the `ios.publishBundlePath`, `ios.publishManifestPath`, `android.publishBundlePath`, and `android.publishManifestPath` keys from your app.json.

### Configure for iOS

Run `npx pod-install` after installing the npm package.

#### Build Phases

In Xcode, under the `Build Phases` tab of your main project, expand the phase entitled "Bundle React Native code and images." Add the following line to the bottom of the script:

```
../node_modules/expo-updates/scripts/create-manifest-ios.sh
```

This provides expo-updates with some important metadata about the update and assets that are embedded in your IPA.

#### `Expo.plist`

Create the file `ios/<your-project-name>/Supporting/Expo.plist` with the following contents, and add it to your Xcode project.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
        <key>EXUpdatesSDKVersion</key>
        <string>YOUR-APP-SDK-VERSION-HERE</string>
        <key>EXUpdatesURL</key>
        <string>YOUR-APP-URL-HERE</string>
</dict>
</plist>
```

EXUpdatesURL is the remote URL at which your app will be hosted, and to which expo-updates will query for new updates. EXUpdatesSDKVersion should match the SDK version in your app.json.

If you use `expo export` or `expo publish` to create your update, it will fill in the proper values here for you (given the file exists), so you don't need to set these values right now.

#### `AppDelegate.h`

In this file, you need to import the `EXUpdatesAppController` header and add `EXUpdatesAppControllerDelegate` as a protocol of your `AppDelegate`. A diff for a typical bare project might look like this (but yours might look different):

```diff
+#import <EXUpdates/EXUpdatesAppController.h>
 #import <React/RCTBridgeDelegate.h>
 #import <UMCore/UMAppDelegateWrapper.h>

-@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate>
+@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate, EXUpdatesAppControllerDelegate>

 @property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
 @property (nonatomic, strong) UIWindow *window;
 ```

#### `AppDelegate.m`

Make the following changes to `AppDelegate.m`.

If your `AppDelegate` has been customized and the diff doesn't apply cleanly, the important part is calling `[[EXUpdatesAppController sharedInstance] startAndShowLaunchScreen:self.window]` in the `application:didFinishLaunchingWithOptions` method, and moving the initialization of the `RCTBridge` to the `EXUpdatesAppControllerDelegate`.

In general, iOS will only show your app's splash screen for a few seconds, after which you must provide a UI. If you use the `startAndShowLaunchScreen:` method, expo-updates will attempt to create a view from your `LaunchScreen.nib` file in order to continue showing the splash screen if the update is taking a long time to load. If you have custom logic around your splash screen and do not want this, feel free to use the `start` method instead.

Providing `EXUpdatesAppController` with a reference to the `RCTBridge` is optional, but required in order for reloading and updates events to work.

```diff
 #import <UMReactNativeAdapter/UMNativeModulesProxy.h>
 #import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

+@interface AppDelegate ()
+
+@property (nonatomic, strong) NSDictionary *launchOptions;
+
+@end
+
 @implementation AppDelegate

...

 - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
 {
   self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
-  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
+  self.launchOptions = launchOptions;
+
+  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
+#ifdef DEBUG
+  [self initializeReactNativeApp];
+#else
+  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
+  controller.delegate = self;
+  [controller startAndShowLaunchScreen:self.window];
+#endif
+
+  [super application:application didFinishLaunchingWithOptions:launchOptions];
+
+  return YES;
+}
+
+- (RCTBridge *)initializeReactNativeApp
+{
+  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];
   RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"YOUR-APP-NAME" initialProperties:nil];
   rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

-  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
   UIViewController *rootViewController = [UIViewController new];
   rootViewController.view = rootView;
   self.window.rootViewController = rootViewController;
   [self.window makeKeyAndVisible];

-  [super application:application didFinishLaunchingWithOptions:launchOptions];
-
-  return YES;
+  return bridge;
 }

...

 #ifdef DEBUG
   return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
 #else
-  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
+  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
 #endif
 }

+- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
+{
+  appController.bridge = [self initializeReactNativeApp];
+}
+
 @end
```

#### `expo-splash-screen`

If you have `expo-splash-screen` installed in your bare workflow project, you'll need to make the following additional change to `AppDelegate.m`:

```diff
+#import <EXSplashScreen/EXSplashScreenService.h>
+#import <UMCore/UMModuleRegistryProvider.h>

 ...

 - (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
 {
   appController.bridge = [self initializeReactNativeApp];
+  EXSplashScreenService *splashScreenService = (EXSplashScreenService *)[UMModuleRegistryProvider getSingletonModuleForClass:[EXSplashScreenService class]];
+  [splashScreenService showSplashScreenFor:self.window.rootViewController];
 }
```

### Configure for Android

#### `app/build.gradle`

Add the following Gradle build script. This provides expo-updates with some important metadata about the update and assets that are embedded in your APK.

```diff
 apply from: "../../node_modules/react-native/react.gradle"
+apply from: "../../node_modules/expo-updates/scripts/create-manifest-android.gradle"
```

#### `AndroidManifest.xml`

Add the following lines inside of the `MainApplication`'s `<application>` tag.

```xml
<meta-data android:name="expo.modules.updates.EXPO_UPDATE_URL" android:value="YOUR-APP-URL-HERE" />
<meta-data android:name="expo.modules.updates.EXPO_SDK_VERSION" android:value="YOUR-APP-SDK-VERSION-HERE" />
```

EXPO_UPDATE_URL is the remote URL at which your app will be hosted, and to which expo-updates will query for new updates. EXPO_SDK_VERSION should match the SDK version in your app.json.

As with iOS, if you use `expo export` or `expo publish` to create your update, it will fill in the proper values here for you (given the file exists), so you don't need to set these values right now.

#### `MainApplication.java`

Make the following changes to `MainApplication.java` (or whichever file you instantiate your `ReactNativeHost`). `UpdatesController.initialize()` expects to be given an instance of `ReactApplication`, but if not, you can also call `UpdatesController.getInstance().setReactNativeHost()` to directly set the host. Providing `UpdatesController` with a reference to the `ReactNativeHost` is optional, but required in order for reloading and updates events to work.

If the diff doesn't apply cleanly, the important parts here are (1) overriding `getJSBundleFile()` and `getBundleAssetName()` from `ReactNativeHost` with the values provided by expo-updates, and (2) initializing `UpdatesController` as early as possible in the application's lifecycle.

```diff
+import android.net.Uri;
+import expo.modules.updates.UpdatesController;
+import javax.annotation.Nullable;
+
 public class MainApplication extends Application implements ReactApplication {
   private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(
     new BasePackageList().getPackageList(),

...

     protected String getJSMainModuleName() {
       return "index";
     }
+
+    @Override
+    protected @Nullable String getJSBundleFile() {
+      if (BuildConfig.DEBUG) {
+        return super.getJSBundleFile();
+      } else {
+        return UpdatesController.getInstance().getLaunchAssetFile();
+      }
+    }
+
+    @Override
+    protected @Nullable String getBundleAssetName() {
+      if (BuildConfig.DEBUG) {
+        return super.getBundleAssetName();
+      } else {
+        return UpdatesController.getInstance().getBundleAssetName();
+      }
+    }
   };

...

   public void onCreate() {
     super.onCreate();
     SoLoader.init(this, /* native exopackage */ false);
+
+    if (!BuildConfig.DEBUG) {
+      UpdatesController.initialize(this);
+    }
+
     initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   }
 }
```

## Embedded Assets

In certain situations, assets that are `require`d by your JavaScript are embedded into your application binary by Xcode/Android Studio. This allows these assets to load when the packager server running locally on your machine is not available.

Debug builds of Android apps do not, by default, have any assets bundled into the APK; they are always loaded at runtime from the Metro packager.

Debug builds of iOS apps built for the iOS simulator also do not have assets bundled into the app. They are loaded at runtime from Metro. Debug builds of iOS apps built for a real device **do** have assets bundled into the app binary, so they can be loaded from disk if they cannot be loaded from the packager at runtime.

Release builds of both iOS and Android apps include a full embedded update, including manifest, JavaScript bundle, and all imported assets. This is critical to ensure that your app can load for all users immediately upon installation, without needing to talk to a server first.

## Configuration

Some build-time configuration options are available to allow your app to update automatically on launch. On iOS, these properties are set as keys in `Expo.plist` and on Android as `meta-data` tags in `AndroidManifest.xml`, adjacent to the tags added during installation.

On Android, you may also define these properties at runtime by passing a `Map` as the second parameter of `UpdatesController.initialize()`. If provided, the values in this Map will override any values specified in `AndroidManifest.xml`. On iOS, you may set these properties at runtime by calling `[UpdatesController.sharedInstance setConfiguration:]` at any point _before_ calling `start` or `startAndShowLaunchScreen`, and the values in this dictionary will override Expo.plist.

| iOS plist/dictionary key | Android Map key | Android meta-data name | Default | Required? |
| --- | --- | --- | --- | --- |
| `EXUpdatesEnabled` | `enabled` | `expo.modules.updates.ENABLED` | `true` | ❌ |

Whether updates are enabled. Setting this to `false` disables all update functionality, all module methods, and forces the app to load with the manifest and assets bundled into the app binary.

| iOS plist/dictionary key | Android Map key | Android meta-data name | Default | Required? |
| --- | --- | --- | --- | --- |
| `EXUpdatesURL` | `updateUrl` | `expo.modules.updates.EXPO_UPDATE_URL` | (none) | ✅ |

URL to the remote server where the app should check for updates

| iOS plist/dictionary key | Android Map key | Android meta-data name | Default | Required? |
| --- | --- | --- | --- | --- |
| `EXUpdatesSDKVersion` | `sdkVersion` | `expo.modules.updates.EXPO_SDK_VERSION` | (none) | (exactly one of `sdkVersion` or `runtimeVersion` is required) |

SDK version to send under the `Expo-SDK-Version` header in the manifest request. Required for apps hosted on Expo's server.

| iOS plist/dictionary key | Android Map key | Android meta-data name | Default | Required? |
| --- | --- | --- | --- | --- |
| `EXUpdatesRuntimeVersion` | `runtimeVersion` | `expo.modules.updates.EXPO_RUNTIME_VERSION` | (none) | (exactly one of `sdkVersion` or `runtimeVersion` is required) |

Runtime version to send under the `Expo-Runtime-Version` header in the manifest request.

| iOS plist/dictionary key | Android Map key | Android meta-data name | Default | Required? |
| --- | --- | --- | --- | --- |
| `EXUpdatesReleaseChannel` | `releaseChannel` | `expo.modules.updates.EXPO_RELEASE_CHANNEL` | `default` | ❌ |

Release channel to send under the `Expo-Release-Channel` header in the manifest request

| iOS plist/dictionary key | Android Map key | Android meta-data name | Default | Required? |
| --- | --- | --- | --- | --- |
| `EXUpdatesCheckOnLaunch` | `checkOnLaunch` | `expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH` | `ALWAYS` | ❌ |

Condition under which expo-updates should automatically check for (and download, if one exists) an update upon app launch. Possible values are `ALWAYS`, `NEVER` (if you want to exclusively control updates via this module's JS API), or `WIFI_ONLY` (if you want the app to automatically download updates only if the device is on an unmetered Wi-Fi connection when it launches).

| iOS plist/dictionary key | Android Map key | Android meta-data name | Default | Required? |
| --- | --- | --- | --- | --- |
| `EXUpdatesLaunchWaitMs` | `launchWaitMs` | `expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS` | `0` | ❌ |

Number of milliseconds expo-updates should delay the app launch and stay on the splash screen while trying to download an update, before falling back to a previously downloaded version. Setting this to `0` will cause the app to always launch with a previously downloaded update and will result in the fastest app launch possible.

# Removing pre-installed expo-updates

Projects created by `expo init` and `expo eject` come with expo-updates pre-installed, because we anticipate most users will want this functionality. However, if you do not intend to use OTA updates, you can disable or uninstall the module.

### Disabling expo-updates

If you disable updates, the module will stay installed in case you ever want to use it in the future, but none of the OTA-updating code paths will ever be executed in your builds. To disable OTA updates, add the `EXUpdatesEnabled` key to Expo.plist with a boolean value of `NO`, and add the following line to AndroidManifest.xml:

```xml
<meta-data android:name="expo.modules.updates.ENABLED" android:value="false"/>
```

### Uninstalling expo-updates

Uninstalling the module will entirely remove all expo-updates related code from your codebase. To do so, complete the following steps:

- Remove `expo-updates` from your package.json and reinstall your node modules.
- Remove the line `../node_modules/expo-updates/scripts/create-manifest-ios.sh` from the "Bundle React Native code and images" Build Phase in Xcode.
- Delete Expo.plist from your Xcode project and file system.
- Remove the line `apply from: "../../node_modules/expo-updates/scripts/create-manifest-android.gradle"` from `android/app/build.gradle`.
- Remove all `meta-data` tags with `expo.modules.updates` in the `android:name` field from AndroidManifest.xml.
- Apply the following three diffs:

#### `AppDelegate.h`

Remove`EXUpdatesAppControllerDelegate` as a protocol of your `AppDelegate`.

```diff
-#import <EXUpdates/EXUpdatesAppController.h>
 #import <React/RCTBridgeDelegate.h>
 #import <UMCore/UMAppDelegateWrapper.h>

-@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate, EXUpdatesAppControllerDelegate>
+@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate>

 @property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
 @property (nonatomic, strong) UIWindow *window;
 ```

#### `AppDelegate.m`

```diff
 #import <UMReactNativeAdapter/UMNativeModulesProxy.h>
 #import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

-@interface AppDelegate ()
-
-@property (nonatomic, strong) NSDictionary *launchOptions;
-
-@end
-
 @implementation AppDelegate

...

 - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
 {
   self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
-  self.launchOptions = launchOptions;
-
-  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
-#ifdef DEBUG
-  [self initializeReactNativeApp];
-#else
-  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
-  controller.delegate = self;
-  [controller startAndShowLaunchScreen:self.window];
-#endif
-
-  [super application:application didFinishLaunchingWithOptions:launchOptions];
-
-  return YES;
-}
-
-- (RCTBridge *)initializeReactNativeApp
-{
-  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];
+  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
   RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"YOUR-APP-NAME" initialProperties:nil];
   rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

+  self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
   UIViewController *rootViewController = [UIViewController new];
   rootViewController.view = rootView;
   self.window.rootViewController = rootViewController;
   [self.window makeKeyAndVisible];

-  return bridge;
+  [super application:application didFinishLaunchingWithOptions:launchOptions];
+
+  return YES;
 }

...

 #ifdef DEBUG
   return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
 #else
-  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
+  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
 #endif
 }

-- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
-{
-  appController.bridge = [self initializeReactNativeApp];
-}
-
 @end
```

#### `MainApplication.java`

```diff
-import android.net.Uri;
-import expo.modules.updates.UpdatesController;
-import javax.annotation.Nullable;
-
 public class MainApplication extends Application implements ReactApplication {
   private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(
     new BasePackageList().getPackageList(),

...

     protected String getJSMainModuleName() {
       return "index";
     }
-
-    @Override
-    protected @Nullable String getJSBundleFile() {
-      if (BuildConfig.DEBUG) {
-        return super.getJSBundleFile();
-      } else {
-        return UpdatesController.getInstance().getLaunchAssetFile();
-      }
-    }
-
-    @Override
-    protected @Nullable String getBundleAssetName() {
-      if (BuildConfig.DEBUG) {
-        return super.getBundleAssetName();
-      } else {
-        return UpdatesController.getInstance().getBundleAssetName();
-      }
-    }
   };

...

   public void onCreate() {
     super.onCreate();
     SoLoader.init(this, /* native exopackage */ false);
-
-    if (!BuildConfig.DEBUG) {
-      UpdatesController.initialize(this);
-    }
-
     initializeFlipper(this, getReactNativeHost().getReactInstanceManager());
   }
 }
 ```

#### Remove Pods Target EXUpdates (Optional)

If, after following above steps, your `npm run ios` or `yarn ios` fails and you see `EXUpdates` in logs, follow the steps below:

- Open the iOS directory in Xcode
- Go to Pods module on right side
- In the targets, find `EXUpdates`, right click and delete
