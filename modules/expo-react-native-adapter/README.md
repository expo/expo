# expo-react-native-adapter

## JavaScript installation

```sh
$ yarn add expo-react-native-adapter

# or

$ npm install expo-react-native-adapter --save
```

## Installation

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'EXReactNativeAdapter'`

and run `pod install`.

### iOS (no Cocoapods)

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
2. Import `<EXCore/EXModuleRegistry.h>` and `<EXReactNativeAdapter/EXNativeModulesProxy.h>`.
3. Make `AppDelegate` implement `RCTBridgeDelegate` protocol (`@interface AppDelegate () <RCTBridgeDelegate>`).
4. Add two methods to the implementation:
    ```objc
    - (NSArray<id<RCTBridgeModule>> *)extraModulesForBridge:(RCTBridge *)bridge
    {
        EXModuleRegistry *moduleRegistry = [[EXModuleRegistry alloc] initWithExperienceId:nil];
        EXNativeModulesProxy *proxy = [[EXNativeModulesProxy alloc] initWithModuleRegistry:moduleRegistry];
        NSMutableArray<id<RCTBridgeModule>> *modules = [NSMutableArray arrayWithObject:proxy];
        [modules addObjectsFromArray:[proxy getBridgeModules]];
        return modules;
    }

    - (NSURL *)sourceURLForBridge:(RCTBridge *)bridge {
        return [[RCTBundleURLProvider sharedSettings] jsBundleURLForBundleRoot:@"index" fallbackResource:nil];
    }
    ```
5. When initializing `RCTBridge`, make the `AppDelegate` a delegate of the bridge:
    ```objc
    RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
    ```
6. That's it!

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
