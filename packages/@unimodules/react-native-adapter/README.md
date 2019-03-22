# @unimodules/react-native-adapter

A React Native adapter for Expo Universal Modules. It requires [`@unimodules/core`](https://github.com/expo/expo/tree/master/packages/@unimodules/core) to be installed and linked.

## JavaScript installation

```sh
$ yarn add @unimodules/react-native-adapter

# or

$ npm install @unimodules/react-native-adapter --save
```

## Installation

If you are using `react-native-unimodules`, this package will already be installed and configured!

### iOS (Cocoapods)

If you're using Cocoapods, add the dependency to your `Podfile`:

`pod 'UMReactNativeAdapter', path: '../node_modules/@unimodules/react-native-adapter/ios', inhibit_warnings: true`

and run `pod install`.

### Android

1.  Append the following lines to `android/settings.gradle`:
    ```gradle
    include ':unimodules-react-native-adapter'
    project(':unimodules-react-native-adapter').projectDir = new File(rootProject.projectDir, '../node_modules/@unimodules/react-native-adapter/android')
    ```
2.  Insert the following lines inside the dependencies block in `android/app/build.gradle`:
    ```gradle
    compile project(':unimodules-react-native-adapter')
    ```

## Additional required setup

#### iOS

1. Open the `AppDelegate.m` of your application.
2. Import `<UMCore/UMModuleRegistry.h>`, `<UMReactNativeAdapter/UMNativeModulesProxy.h>` and `<UMReactNativeAdapter/UMModuleRegistryAdapter.h>`.
3. Make `AppDelegate` implement `RCTBridgeDelegate` protocol (`@interface AppDelegate () <RCTBridgeDelegate>`).
4. Add a new instance variable to your `AppDelegate`:

   ```objc
   @interface AppDelegate () <RCTBridgeDelegate>

   // add this line
   @property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;

   @end
   ```

5. In `-application:didFinishLaunchingWithOptions:` add the following at the top of the implementation:
   ```objc
   self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
   ```
6. Add two methods to the `AppDelegate`'s implementation:

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

7. When initializing `RCTBridge`, make the `AppDelegate` a delegate of the bridge:
   ```objc
   RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
   ```
8. That's it! All in all, your `AppDelegate.m` should look similar to:

   <details>
       <summary>Click to expand</summary>
       <p>

   ```objc
   #import "AppDelegate.h"

   #import <React/RCTBundleURLProvider.h>
   #import <React/RCTRootView.h>

   #import <UMCore/UMModuleRegistry.h>
   #import <UMReactNativeAdapter/UMNativeModulesProxy.h>
   #import <UMReactNativeAdapter/UMModuleRegistryAdapter.h>

   @interface AppDelegate () <RCTBridgeDelegate>

   @property (nonatomic, strong) UMModuleRegistryAdapter *moduleRegistryAdapter;

   @end

   @implementation AppDelegate

   - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
   {
       self.moduleRegistryAdapter = [[UMModuleRegistryAdapter alloc] initWithModuleRegistryProvider:[[UMModuleRegistryProvider alloc] init]];
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
       // If you'd like to export some custom RCTBridgeModules that are not universal modules, add them here!
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
   import org.unimodules.adapters.react.ModuleRegistryAdapter;
   import org.unimodules.adapters.react.ReactAdapterPackage;
   import org.unimodules.adapters.react.ReactModuleRegistryProvider;
   import org.unimodules.core.interfaces.Package;
   ```
3. Create an instance variable on the `Application`:
   ```java
   private final ReactModuleRegistryProvider mModuleRegistryProvider = new ReactModuleRegistryProvider(Arrays.<Package>asList(
       new ReactAdapterPackage()
       // more packages, like
       // new CameraPackage(), if you use expo-camera
       // etc.
   ), /* singletonModules */ null);
   ```
4. Add `new ModuleRegistryAdapter(mModuleRegistryProvider)` to the list returned by `protected List<ReactPackage> getPackages()`.
5. You're good to go!

## Usage

### Calling methods on native modules

Native modules are available behind the proxy (`NativeModulesProxy` of `@unimodules/core`).

To call an exported method, use `NativeModulesProxy[clientCodeName].exportedMethod(...arguments)`, like this:

```js
// For UM_REGISTER_MODULE(FileSystem,) or UM_REGISTER_UMPORTED_MODULE(FileSystem)
// and UM_EXPORT_METHOD_AS(getInfo, getInfo:(NSString *)path)

// or for method
// @ExpoMethod
// public void getInfo(String path, Promise promise)
// defined in native module with name FileSystem

import { NativeModulesProxy } from '@unimodules/core';

const { FileSystem } = NativeModulesProxy;

FileSystem.getInfo('file:///...');
```

Note that all the methods return `Promise`s.

### Synthetic Platform Events

When creating web universal modules, you may find that you need to send events back to the API layer.
In this case you will want to use the shared `SyntheticPlatformEmitter` instance from `@unimodules/core`. The shared emitter emit events to `react-native`'s `NativeEventEmitter` and `@unimodules/core`'s `EventEmitter` .

`ExponentGyroscope.web.ts`

```js
// Example from expo-sensors native web gyroscope sensor

import { SyntheticPlatformEmitter } from '@unimodules/core';

SyntheticPlatformEmitter.emit('gyroscopeDidUpdate', { x, y, z });
```

This emitted event is then received with a `EventEmitter` in the developer-facing API.

```js
import { EventEmitter } from '@unimodules/core';

import ExponentGyroscope from './ExponentGyroscope';

const nativeEmitter = new EventEmitter(ExponentGyroscope);

// On Android and iOS, `nativeEmitter` receives events sent from Objective-C and Java. On web, it
// receives events from the shared `SyntheticPlatformEmitter` instance.
nativeEmitter.addListener('gyroscopeDidUpdate', ({ x, y, z }) => {});
```
