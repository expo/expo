# expo-updates

`expo-updates` fetches and manages updates to your app stored on a remote server.

See [Updates docs](https://docs.expo.io/versions/latest/sdk/updates) for documentation of this universal module's API.

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

## Compatibility

This module requires `expo-cli@3.17.6` or later; make sure your global installation is at least this version before proceeding.

Additionally, this module is only compatible with Expo SDK 37 or later. For bare workflow projects, if the `expo` package is installed, it must be version `37.0.2` or later.

Finally, this module is not compatible with ExpoKit. Make sure you do not have `expokit` listed as a dependency in package.json before this module.

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

If you installed `expo-asset` and have other assets (such as images or other media) that are `require`d in your application code, and you would like these to also be bundled into your application binary, add the `assetBundlePatterns` field under the `expo` key in your project's app.json. This field should be an array of file glob strings which point to the assets you want bundled. For example:

```json
  "assetBundlePatterns": ["**/*"],
```

Finally, if you're migrating from an ExpoKit project to the bare workflow with `expo-updates`, remove the `ios.publishBundlePath`, `ios.publishManifestPath`, `android.publishBundlePath`, and `android.publishManifestPath` keys from your app.json.

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

#### Build Phases

In Xcode, under the `Build Phases` tab of your main project, expand the phase entitled "Bundle React Native code and images." Optionally rename the phase to "Bundle Expo Assets," and replace the entire body of the script with the following:

```
../node_modules/expo-updates/bundle-expo-assets.sh
```

This will configure your project to bundle assets from your published update when making release mode builds. For more information, see the section below on [Embedded Assets](#embedded-assets).

**Optional: Do not start packager in release builds**

This step is completely optional! Since the React Native packager is not used in release builds, you can prevent it from starting and opening an unnecessary terminal window every time you make a release build. To do so, just add the following lines to the beginning of the script in the "Start Packager" build phase:

```sh
if [ "$CONFIGURATION" == "Release" ]; then
  exit 0;
fi
```

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

### Configure for Android

#### `app/build.gradle`

Make the following change in order to bundle assets from expo-updates instead of your local metro server when making release mode builds. For more information, see the section below on [Embedded Assets](#embedded-assets).

```diff
 project.ext.react = [
     entryFile: "index.js",
+    bundleInRelease: false,
     enableHermes: false
 ]

 apply from: "../../node_modules/react-native/react.gradle"
+apply from: "../../node_modules/expo-updates/expo-updates.gradle"
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
   }
 }
```

## Embedded Assets

In certain situations, assets that are `require`d by your JavaScript are embedded into your application binary by Xcode/Android Studio. This allows these assets to load when the packager server running locally on your machine is not available.

Debug builds of Android apps do not, by default, have any assets bundled into the APK; they are always loaded at runtime from the Metro packager.

Debug builds of iOS apps built for the iOS simulator also do not have assets bundled into the app. They are loaded at runtime from Metro. Debug builds of iOS apps built for a real device **do** have assets bundled into the app binary, so they can be loaded from disk if they cannot be loaded from the packager at runtime.

Release builds of both iOS and Android apps include a full embedded update, including manifest, JavaScript bundle, and all `require`d assets. This is critical to ensure that your app can load for all users immediately upon installation, without needing to talk to a server first.

Note that when you make a release build, the update that will run on first launch is the update whose manifest and bundle are embedded in the binary at build time -- i.e. your most recently exported/published update. **This is different behavior from plain React Native projects**, which create a new bundle on-demand each time you make a release build. This means that if you make a change to your JavaScript app, you need to export/publish a new update in order to see that change in a release build. In future versions of `expo-updates` we hope to support on-demand updates created at build-time.

### Embed an initial update

Before building an `expo-update`-enabled release build of your app, you need to create an initial update to embed into the app binary.

If you're not using Expo CLI, you need to create a manifest and bundle for this initial update. The files should be named `app.manifest` and `app.bundle`. (See the documentation on [Updating your App](https://docs/expo.io/versions/latest/bare/updating-your-app/) for the format of the manifest.) To embed them into your Android project, place a copy in the `android/app/src/main/assets` folder. To embed them into your iOS app, place them in the `ios/<your-project-name>` folder (or any subfolder) and add them to your Xcode project in the Xcode GUI.

If you're using Expo CLI, you just need to run `expo export` or `expo publish` once before making a release build. After doing so, be sure to **add `ios/<your-project-name>/Supporting/app.manifest` and `ios/<your-project-name>/Supporting/app.bundle` to your Xcode project**.

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

## API

```js
import * as Updates from 'expo-updates';
```

### Constants

- **`Updates.manifest` (_object_)** - If `expo-updates` is enabled, this is the [manifest](https://docs.expo.io/versions/latest/workflow/how-expo-works/#expo-development-server) object for the update that's currently running. In development mode, or any other environment in which `expo-updates` is disabled, this object is empty.
- **`Updates.isEmergencyLaunch` (_boolean_)** - `expo-updates` does its very best to always launch monotonically newer versions of your app so you don't need to worry about backwards compatibility when you put out an update. In very rare cases, it's possible that `expo-updates` may need to fall back to the update that's embedded in the app binary, even after newer updates have been downloaded and run (an "emergency launch"). This boolean will be `true` if the app is launching under this fallback mechanism and `false` otherwise. If you are concerned about backwards compatibility of future updates to your app, you can use this constant to provide special behavior for this rare case.

### `Updates.reloadAsync()`

Instructs the app to reload using the most recently downloaded version. This is useful for triggering a newly downloaded update to launch without the user needing to manually restart the app.

This method cannot be used in development mode, and the returned `Promise` will be rejected if you try to do so.

#### Returns

A `Promise` that resolves right before the reload instruction is sent to the JS runtime, or rejects if it cannot find a reference to the JS runtime.

If the `Promise` is rejected in production mode, it most likely means you have installed the module incorrectly. Double check you've followed the instructions above. In particular, on iOS ensure that you set the `bridge` property on `EXUpdatesAppController` with a pointer to the `RCTBridge` you want to reload, and on Android ensure you either call `UpdatesController.initialize` with the instance of `ReactApplication` you want to reload, or call `UpdatesController.setReactNativeHost` with the proper instance of `ReactNativeHost`.

### `Updates.checkForUpdateAsync()`

Checks the server at the provided remote URL to see if a newly deployed version of your project is available. Does not actually download the update.

This method cannot be used in development mode, and the returned `Promise` will be rejected if you try to do so.

#### Returns

A `Promise` that resolves to an object with the following keys:

- **isAvailable (_boolean_)** -- `true` if an update is available, `false` if you're already running the most up-to-date JS bundle.
- **manifest (_object_)** -- If `isAvailable` is true, the manifest of the available update. Undefined otherwise.

The `Promise` rejects if the app is in development mode, or if there is an unexpected error communicating with the server.

### `Updates.fetchUpdateAsync()`

Downloads the most recently deployed version of your project from server to the device's local storage.

This method cannot be used in development mode, and the returned `Promise` will be rejected if you try to do so.

#### Returns

A `Promise` that resolves to an object with the following keys:

- **isNew (_boolean_)** -- `true` if the fetched bundle is new (i.e. a different version than what's currently running), `false` otherwise.
- **manifest (_object_)** -- If `isNew` is true, the manifest of the newly downloaded update. Undefined otherwise.

The `Promise` rejects if the app is in development mode, or if there is an unexpected error communicating with the server.

### `Updates.addListener(eventListener)`

Adds a callback to be invoked when updates-related events occur (such as upon the initial app load) due to auto-update settings chosen at build-time.

#### Arguments

- **eventListener (_(event: [UpdateEvent](#updateevent)) => void_)** -- A function that will be invoked with an instance of [`UpdateEvent`](#updateevent) and should not return any value.

#### Returns

An [`EventSubscription`](#eventsubscription) object on which you can call `remove()` if you would like to unsubscribe from the listener.

### Related types

### `EventSubscription`

An object returned from `addListener`.

- **remove() (_function_)** -- Unsubscribe the listener from future updates.

### `UpdateEvent`

An object that is passed into each event listener when an auto-update check has occurred.

- **type (_string_)** -- Type of the event (see [`EventType`](#eventtype)).
- **manifest (_object_)** -- If `type === Updates.EventType.UPDATE_AVAILABLE`, the manifest of the newly downloaded update. Undefined otherwise.
- **message (_string_)** -- If `type === Updates.EventType.ERROR`, the error message. Undefined otherwise.

### `EventType`

- **`Updates.EventType.UPDATE_AVAILABLE`** -- A new update has finished downloading to local storage. If you would like to start using this update at any point before the user closes and restarts the app on their own, you can call `Updates.reloadAsync()` to launch this new update.
- **`Updates.EventType.NO_UPDATE_AVAILABLE`** -- No updates are available, and the most up-to-date bundle of this experience is already running.
- **`Updates.EventType.ERROR`** -- An error occurred trying to fetch the latest update.
