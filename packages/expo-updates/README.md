# expo-updates

`expo-updates` fetches and manages remotely-hosted assets and updates to your app's JS bundle.

See [Updates docs](https://docs.expo.io/versions/latest/sdk/updates) for documentation of this universal module's API.

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-updates
```

### Setup app.json

Expo can automatically include your app's manifest and JS bundle in your iOS and Android binaries, so that users can launch your app immediately for the first time without needing an internet connection. Add the following fields under the `expo` key in your project's app.json:

```json
  "ios": {
    "publishBundlePath": "ios/<your-project-name>/Supporting/shell-app.bundle",
    "publishManifestPath": "ios/<your-project-name>/Supporting/shell-app-manifest.json"
  },
  "android": {
    "publishBundlePath": "android/app/src/main/assets/shell-app.bundle",
    "publishManifestPath": "android/app/src/main/assets/shell-app-manifest.json"
  },
```

Additionally, ensure that these directories (`ios/<your-project-name>/Supporting/` and `android/app/src/main/assets/`) exist. After running `expo publish` at least once, you'll need to manually add the `shell-app.bundle` and `shell-app-manifest.json` files to your Xcode project.

Finally, if you have other assets (such as images or other media) that are `require`d in your application code and you would like these to also be bundled into your application binary, add the `assetBundlePatterns` field under the `expo` key in your project's app.json. This field should be an array of file glob strings which point to the assets you want bundled. For example:

```json
  "assetBundlePatterns": ["**/*"],
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

#### `expo-config.plist`

Create the file `ios/<your-project-name>/Supporting/expo-config.plist` with the following contents, and add it to your Xcode project.

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
        <key>sdkVersion</key>
        <string>YOUR-APP-SDK-VERSION-HERE</string>
        <key>remoteUrl</key>
        <string>YOUR-APP-URL-HERE</string>
</dict>
</plist>
```

#### `AppDelegate.h`

```diff
 #import <React/RCTBridgeDelegate.h>
 #import <UMCore/UMAppDelegateWrapper.h>

-@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate>
+#import <EXUpdates/EXUpdatesAppController.h>
+
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

#### `AndroidManifest.xml`

Add the following lines inside of the `MainApplication`'s `<application>` tag.

```xml
<meta-data android:name="expo.modules.updates.EXPO_APP_URL" android:value="YOUR-APP-URL-HERE" />
<meta-data android:name="expo.modules.updates.EXPO_SDK_VERSION" android:value="YOUR-APP-SDK-VERSION-HERE" />
```

#### `MainApplication.java`

Make the following changes to `MainApplication.java` (or whichever file you instantiate your `ReactNativeHost`). `UpdatesController.initialize()` expects to be given an instance of `ReactApplication`, but if not, you can also call `UpdatesController.getInstance().setReactNativeHost()` to directly set the host. Providing `UpdatesController` with a reference to the `ReactNativeHost` is optional, but required in order for reloading and updates events to work.

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
+      UpdatesController.getInstance().start(this);
+    }
   }
 }
```

TODO: asset bundling setup

## Configuration

Some build-time configuration options are available to allow your app to update automatically on launch.
// TODO

## API

```js
import * as Updates from 'expo-updates';
```

### `Updates.reloadAsync()`

Instructs the app to reload using the most recent cached version. This is useful for triggering an update of your experience if you have published and already downloaded a new version.

#### Returns

A `Promise` that resolves right before the reload instruction is sent to the JS runtime, or rejects if it cannot find a reference to the JS runtime.

If the `Promise` is rejected, it most likely means you have installed the module incorrectly. Double check you've followed the instructions above. In particular, on iOS ensure that you set the `bridge` property on `EXUpdatesAppController` with a pointer to the `RCTBridge` you want to reload, and on Android ensure you either call `UpdatesController.initialize` with the instance of `ReactApplication` you want to reload, or call `UpdatesController.setReactNativeHost` with the proper instance of `ReactNativeHost`.

### `Updates.checkForUpdateAsync()`

Checks the app's remote URL to see if a new published version of your project is available. Does not actually download the update.

#### Returns

An `Promise` that resolves to an object with the following keys:

- **isAvailable (_boolean_)** -- `true` if an update is available, `false` if you're already running the most up-to-date JS bundle.
- **manifest (_object_)** -- If `isAvailable` is true, the manifest of the available update. Undefined otherwise.

The `Promise` rejects if the app is in development mode, or if there is an unexpected error communicating with the server.

### `Updates.fetchUpdateAsync()`

Downloads the most recently published version of your project from the app's remote URL to the device's local storage.

#### Returns

An object with the following keys:

- **isNew (_boolean_)** -- `true` if the fetched bundle is new (i.e. a different version than what's currently running), `false` otherwise.
- **manifest (_object_)** -- If `isNew` is true, the manifest of the newly downloaded update. Undefined otherwise.

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
