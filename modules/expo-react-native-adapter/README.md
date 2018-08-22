# expo-react-native-adapter

A React Native adapter for Expo Universal Modules. It requires [`expo-core`](https://github.com/expo/expo-core) to be installed and linked.

**Note:** The following installation/setup instructions are only applicable to plain React Native applications, i. e. if your project is a detached Expo project and it has ExpoKit/expoview included, the installation has already been done for you.

## JavaScript installation

```sh
$ yarn add expo-react-native-adapter

# or

$ npm install expo-react-native-adapter --save
```

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXReactNativeAdapter', path: '../node_modules/expo-react-native-adapter/ios', inhibit_warnings: true`

and run `pod install`.

### iOS (no Cocoapods) _[this method is currently not supported, sorry]_

1.  In XCode, in the project navigator, right click `Libraries` ➜ `Add Files to [your project's name]`
2.  Go to `node_modules` ➜ `expo-react-native-adapter` and add `EXReactNativeAdapter.xcodeproj`
3.  In XCode, in the project navigator, select your project. Add `libEXReactNativeAdapter.a` to your project's `Build Phases` ➜ `Link Binary With Libraries`
4.  Run your project (`Cmd+R`).

### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':expo-react-native-adapter'
    project(':expo-react-native-adapter').projectDir = new File(rootProject.projectDir, '../node_modules/expo-react-native-adapter/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':expo-react-native-adapter')
    ```

## Additional required setup

#### iOS

1. Open the `AppDelegate.m` of your application.
2. Import `<EXCore/EXModuleRegistry.h>`, `<EXReactNativeAdapter/EXNativeModulesProxy.h>` and `<EXReactNativeAdapter/EXModuleRegistryAdapter.h>`.
3. Make `AppDelegate` implement `RCTBridgeDelegate` protocol (`@interface AppDelegate () <RCTBridgeDelegate>`).
4. Add a new instance variable to your `AppDelegate`:
    ```objc
    @interface AppDelegate () <RCTBridgeDelegate>

    // add this line
    @property (nonatomic, strong) EXModuleRegistryAdapter *moduleRegistryAdapter;

    @end
    ```
5. In `-application:didFinishLaunchingWithOptions:` add the following at the top of the implementation:
    ```objc
    self.moduleRegistryAdapter = [[EXModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[EXModuleRegistryProvider alloc] init]];
    ```
4. Add two methods to the `AppDelegate`'s implementation:
    ```objc
    - (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
    {
        NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge andExperience:nil];
        // If you'd like to export some custom RCTBridgeModules that are not Expo modules, add them here!
        return extraModules;
    }

    - (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
        return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
    }
    ```
5. When initializing `RCTBridge`, make the `AppDelegate` a delegate of the bridge:
    ```objc
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
    ```
6. That's it! All in all, your `AppDelegate.m` should look similar to:
    <details>
        <summary>Click to expand</summary>
        <p>

    ```objc
    #import "AppDelegate.h"

    #import <React/RCTBundleURLProvider.h>
    #import <React/RCTRootView.h>

    #import <EXCore/EXModuleRegistry.h>
    #import <EXReactNativeAdapter/EXNativeModulesProxy.h>
    #import <EXReactNativeAdapter/EXModuleRegistryAdapter.h>

    @interface AppDelegate () <RCTBridgeDelegate>

    @property (nonatomic, strong) EXModuleRegistryAdapter *moduleRegistryAdapter;

    @end

    @implementation AppDelegate

    - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
    {
        self.moduleRegistryAdapter = [[EXModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[EXModuleRegistryProvider alloc] init]];
        RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
        RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge moduleName:@"YOUR_MODULE_NAME" initialProperties:nil];
        rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];

        self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
        UIViewController *rootViewController = [UIViewController new];
        rootViewController.view = rootView;
        self.window.rootViewController = rootViewController;
        [self.window makeKeyAndVisible];
        return YES;
    }

    - (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
    {
        NSArray<id<RCTBridgeModule>> *extraModules = [_moduleRegistryAdapter extraModulesForBridge:bridge andExperience:nil];
        // If you'd like to export some custom RCTBridgeModules that are not Expo modules, add them here!
        return extraModules;
    }

    - (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
        return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
    }

    @end
    ```

    </details>

#### Android

1. Open the `MainApplication.java` of your application.
2. Add to the imports:
    ```java
    import expo.adapters.react.ModuleRegistryAdapter;
    import expo.adapters.react.ReactAdapterPackage;
    import expo.core.ModuleRegistryProvider;
    import expo.core.interfaces.Package;
    ```
3. Create an instance variable on the `Application`:
    ```java
    private final ModuleRegistryProvider mModuleRegistryProvider = new ModuleRegistryProvider(Arrays.<Package>asList(
        new ReactAdapterPackage(),
        // more packages, like
        // new CameraPackage(), if you use expo-camera
        // etc.
    ));
    ```
4. Add `new ModuleRegistryAdapter(mModuleRegistryProvider)` to the list returned by `protected List<ReactPackage> getPackages()`.
5. You're good to go!

## Usage

### Calling methods on native modules

Native modules are available behind the proxy (`NativeModulesProxy` of `expo-core`).

To call an exported method, use `NativeModulesProxy[clientCodeName].exportedMethod(...arguments)`, like this:

```js
// For EX_REGISTER_MODULE(FileSystem,) or EX_REGISTER_EXPORTED_MODULE(FileSystem)
// and EX_EXPORT_METHOD_AS(getInfo, getInfo:(NSString *)path)

// or for method
// @ExpoMethod
// public void getInfo(String path, Promise promise)
// defined in native module with name FileSystem

import { NativeModulesProxy } from 'expo-core';

const { FileSystem } = NativeModulesProxy;

FileSystem.getInfo("file:///...");
```

Note that all the methods return `Promise`s.
