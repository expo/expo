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

For [managed](https://docs.expo.io/versions/latest/introduction/managed-vs-bare/) Expo projects, please follow the installation instructions in the [API documentation for the latest stable release](https://docs.expo.io/versions/latest/sdk/updates/).

# Installation in bare React Native projects

Learn how to install expo-updates in your project in the [Installing expo-updates documentation page](https://docs.expo.io/bare/installing-updates/).

## Embedded Assets

In certain situations, assets that are `require`d by your JavaScript are embedded into your application binary by Xcode/Android Studio. This allows these assets to load when the packager server running locally on your machine is not available.

Debug builds of Android apps do not, by default, have any assets bundled into the APK; they are always loaded at runtime from the Metro packager.

Debug builds of iOS apps built for the iOS simulator also do not have assets bundled into the app. They are loaded at runtime from Metro. Debug builds of iOS apps built for a real device **do** have assets bundled into the app binary, so they can be loaded from disk if they cannot be loaded from the packager at runtime.

Release builds of both iOS and Android apps include a full embedded update, including manifest, JavaScript bundle, and all imported assets. This is critical to ensure that your app can load for all users immediately upon installation, without needing to talk to a server first.

## Configuration

Some build-time configuration options are available to allow your app to update automatically on launch. On iOS, these properties are set as keys in `Expo.plist` and on Android as `meta-data` tags in `AndroidManifest.xml`, adjacent to the tags added during installation.

On Android, you may also define these properties at runtime by passing a `Map` as the second parameter of `UpdatesController.initialize()`. If provided, the values in this Map will override any values specified in `AndroidManifest.xml`. On iOS, you may set these properties at runtime by calling `[UpdatesController.sharedInstance setConfiguration:]` at any point _before_ calling `start` or `startAndShowLaunchScreen`, and the values in this dictionary will override Expo.plist.

| iOS plist/dictionary key | Android Map key | Android meta-data name         | Default | Required? |
| ------------------------ | --------------- | ------------------------------ | ------- | --------- |
| `EXUpdatesEnabled`       | `enabled`       | `expo.modules.updates.ENABLED` | `true`  | ❌        |

Whether updates are enabled. Setting this to `false` disables all update functionality, all module methods, and forces the app to load with the manifest and assets bundled into the app binary.

| iOS plist/dictionary key | Android Map key | Android meta-data name                 | Default | Required? |
| ------------------------ | --------------- | -------------------------------------- | ------- | --------- |
| `EXUpdatesURL`           | `updateUrl`     | `expo.modules.updates.EXPO_UPDATE_URL` | (none)  | ✅        |

The URL to the remote server where the app should check for updates. A request to this URL should return a valid manifest object for the latest available update and tells expo-updates how to fetch the JS bundle and other assets that comprise the update. (Example: for apps published with `expo publish`, this URL would be `https://exp.host/@username/slug`.)

| iOS plist/dictionary key | Android Map key | Android meta-data name                  | Default | Required?                                                     |
| ------------------------ | --------------- | --------------------------------------- | ------- | ------------------------------------------------------------- |
| `EXUpdatesSDKVersion`    | `sdkVersion`    | `expo.modules.updates.EXPO_SDK_VERSION` | (none)  | (exactly one of `sdkVersion` or `runtimeVersion` is required) |

The SDK version string to send under the `Expo-SDK-Version` header in the manifest request. Required for apps hosted on Expo's server.

| iOS plist/dictionary key  | Android Map key  | Android meta-data name                      | Default | Required?                                                     |
| ------------------------- | ---------------- | ------------------------------------------- | ------- | ------------------------------------------------------------- |
| `EXUpdatesRuntimeVersion` | `runtimeVersion` | `expo.modules.updates.EXPO_RUNTIME_VERSION` | (none)  | (exactly one of `sdkVersion` or `runtimeVersion` is required) |

The Runtime Version string to send under the `Expo-Runtime-Version` header in the manifest request.

| iOS plist/dictionary key  | Android Map key  | Android meta-data name                      | Default   | Required? |
| ------------------------- | ---------------- | ------------------------------------------- | --------- | --------- |
| `EXUpdatesReleaseChannel` | `releaseChannel` | `expo.modules.updates.EXPO_RELEASE_CHANNEL` | `default` | ❌        |

The release channel string to send under the `Expo-Release-Channel` header in the manifest request.

| iOS plist/dictionary key | Android Map key | Android meta-data name                              | Default  | Required? |
| ------------------------ | --------------- | --------------------------------------------------- | -------- | --------- |
| `EXUpdatesCheckOnLaunch` | `checkOnLaunch` | `expo.modules.updates.EXPO_UPDATES_CHECK_ON_LAUNCH` | `ALWAYS` | ❌        |

The condition under which `expo-updates` should automatically check for (and download, if one exists) an update upon app launch. Possible values are `ALWAYS`, `NEVER` (if you want to exclusively control updates via this module's JS API), or `WIFI_ONLY` (if you want the app to automatically download updates only if the device is on an unmetered Wi-Fi connection when it launches).

| iOS plist/dictionary key | Android Map key | Android meta-data name                             | Default | Required? |
| ------------------------ | --------------- | -------------------------------------------------- | ------- | --------- |
| `EXUpdatesLaunchWaitMs`  | `launchWaitMs`  | `expo.modules.updates.EXPO_UPDATES_LAUNCH_WAIT_MS` | `0`     | ❌        |

The number of milliseconds `expo-updates` should delay the app launch and stay on the splash screen while trying to download an update, before falling back to a previously downloaded version. Setting this to `0` will cause the app to always launch with a previously downloaded update and will result in the fastest app launch possible.

## Customizing automatic setup

In `expo-updates@0.9.0` and above, we support automatic installation of the module in the iOS AppDelegate.m and Android MainApplication.java classes. If you want to customize the installation, e.g. to enable updates only in some build variants, you can add custom logic in AppDelegate/MainApplication and set the following keys to `false` in order to disable the automatic setup.

| iOS Expo.plist key   | Android meta-data name            | Default | Required? |
| -------------------- | --------------------------------- | ------- | --------- |
| `EXUpdatesAutoSetup` | `expo.modules.updates.AUTO_SETUP` | `true`  | ❌        |

# Removing pre-installed expo-updates

Projects created by `expo init` and `expo eject` come with expo-updates pre-installed, because we anticipate most users will want this functionality. However, if you do not intend to use OTA updates, you can disable or uninstall the module.

## Disabling expo-updates

If you disable updates, the module will stay installed in case you ever want to use it in the future, but none of the OTA-updating code paths will ever be executed in your builds. To disable OTA updates, add the `EXUpdatesEnabled` key to Expo.plist with a boolean value of `NO`, and add the following line to AndroidManifest.xml:

```xml
<meta-data android:name="expo.modules.updates.ENABLED" android:value="false"/>
```

## Uninstalling expo-updates (for expo-updates >= 0.9.0)

Uninstalling the module will entirely remove all expo-updates related code from your codebase. To do so, complete the following steps:

- Remove `expo-updates` from your package.json and reinstall your node modules.
- Delete Expo.plist from your Xcode project and file system.
- Remove all `meta-data` tags with `expo.modules.updates` in the `android:name` field from AndroidManifest.xml.

## Uninstalling expo-updates (for expo-updates < 0.9.0)

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
