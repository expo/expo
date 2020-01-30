# expo-updates

`expo-updates` fetches and manages remotely-hosted assets and updates to your app's JS bundle.

See [<ModuleName> docs](https://docs.expo.io/versions/latest/sdk/<module-docs-name>) for documentation of this universal module's API.

# Installation

This package is pre-installed in [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects. You may skip the rest of the installation guide if this applies to you.

For bare React Native projects, you must ensure that you have [installed and configured the `react-native-unimodules` package](https://github.com/unimodules/react-native-unimodules) before continuing.

### Add the package to your npm dependencies

```
expo install expo-updates
```

### Configure for iOS

Run `pod install` in the ios directory after installing the npm package.

- expo-config.plist

Add this to Xcode project

- AppDelegate.h

```objective-c
diff --git a/ios/HelloWorld/AppDelegate.h b/ios/HelloWorld/AppDelegate.h
index 78fbb4d..080b9a0 100644
--- a/ios/HelloWorld/AppDelegate.h
+++ b/ios/HelloWorld/AppDelegate.h
@@ -10,7 +10,9 @@
 #import <React/RCTBridgeDelegate.h>
 #import <UMCore/UMAppDelegateWrapper.h>

-@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate>
+#import <EXUpdates/EXUpdatesAppController.h>
+
+@interface AppDelegate : UMAppDelegateWrapper <RCTBridgeDelegate, EXUpdatesAppControllerDelegate>

 @property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;
 @property (nonatomic, strong) UIWindow *window;
 ```

- AppDelegate.m

```objective-c
diff --git a/ios/HelloWorld/AppDelegate.m b/ios/HelloWorld/AppDelegate.m
index 41042d3..81a7150 100644
--- a/ios/HelloWorld/AppDelegate.m
+++ b/ios/HelloWorld/AppDelegate.m
@@ -14,6 +14,12 @@
 #import <UMReactNativeAdapter/UMNativeModulesProxy.h>
 #import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

+@interface AppDelegate ()
+
+@property (nonatomic, strong) NSDictionary *launchOptions;
+
+@end
+
 @implementation AppDelegate

 @synthesize window = _window;
@@ -21,15 +27,12 @@
 - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
 {
   self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
-  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
-  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"HelloWorld" initialProperties:nil];
-  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
+  self.launchOptions = launchOptions;

   self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
-  UIViewController *rootViewController = [UIViewController new];
-  rootViewController.view = rootView;
-  self.window.rootViewController = rootViewController;
-  [self.window makeKeyAndVisible];
+  EXUpdatesAppController *controller = [EXUpdatesAppController sharedInstance];
+  controller.delegate = self;
+  [controller startAndShowLaunchScreen:self.window];

   [super application:application didFinishLaunchingWithOptions:launchOptions];

@@ -48,8 +51,21 @@
 #ifdef DEBUG
   return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
 #else
-  return [[NSBundle mainBundle] URLForResource:@"main" withExtension:@"jsbundle"];
+  return [[EXUpdatesAppController sharedInstance] launchAssetUrl];
 #endif
 }

+- (void)appController:(EXUpdatesAppController *)appController didStartWithSuccess:(BOOL)success
+{
+  RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:self.launchOptions];
+  appController.bridge = bridge;
+  RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"bareUpdates1" initialProperties:nil];
+  rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
+
+  UIViewController *rootViewController = [UIViewController new];
+  rootViewController.view = rootView;
+  self.window.rootViewController = rootViewController;
+  [self.window makeKeyAndVisible];
+}
+
 @end
```

### Configure for Android

- AndroidManifest.xml

Skip this step if you're using Expo's servers to host your OTA updates (i.e. running `expo publish`).

// TODO: auto-set in expo publish

```xml
<meta-data android:name="expo.modules.updates.EXPO_APP_URL" android:value="<url>" />
<meta-data android:name="expo.modules.updates.EXPO_SDK_VERSION" android:value="36.0.0" />
```

- MainApplication.java

```java
...

+import android.net.Uri;
+import expo.modules.updates.UpdatesController;
+import javax.annotation.Nullable;
+
 public class MainApplication extends Application implements ReactApplication {
   private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(
     new BasePackageList().getPackageList(),
@@ -51,6 +55,15 @@ public class MainApplication extends Application implements ReactApplication {
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

   @Override
@@ -62,5 +75,10 @@ public class MainApplication extends Application implements ReactApplication {
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
 TODO: other initialization setup (app.json keys, etc)

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
