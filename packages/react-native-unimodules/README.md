# react-native-unimodules

This library contains the core unimodule infrastructure and a collection of unimodules and interfaces that are commonly depended on by other unimodules. You only need to install `react-native-unimodules` once and then you will be able to use [most of the packages from the Expo SDK](https://docs.expo.io/versions/latest/bare/unimodules-full-list/), like [expo-camera](https://docs.expo.io/versions/latest/sdk/camera/), [expo-media-library](https://docs.expo.io/versions/latest/sdk/media-library/) and many more, [in any React Native project](https://blog.expo.io/you-can-now-use-expo-apis-in-any-react-native-app-7c3a93041331).

The easiest way to use the library is to initialize a project with it already installed: `npx create-react-native-app my-app`.

> You can also use `expo-cli` to do this - run `npm i -g expo-cli` and then `expo init --template bare-minimum` or `expo init --template expo-template-bare-typescript` if you prefer TypeScript.

If you have an existing project you'd like to install it into, please read the following instructions.

## 📦 Installation

**This project requires that you use CocoaPods on iOS**, to set it up follow relevant parts of [this guide](https://facebook.github.io/react-native/docs/integration-with-existing-apps#3-install-cocoapods). React Native >= 0.60 ships with CocoaPods support by default, so this should be easy if you're already on that version.

```bash
npm install react-native-unimodules
```

Now you need to configure the library for iOS and/or Android.

## 🍎 Configure iOS

- Open `ios/Podfile` in your editor and:
  - Import the Unimodules functions by requiring the `cocoapods.rb` file:
    ```diff
     # ...

    +require_relative '../node_modules/react-native-unimodules/cocoapods.rb'
    +
     target 'YourAppNameHere' do
       # ...
    ```
  - Import Unimodules dependencies using `use_unimodules!` method:
    ```diff
     target 'YourAppNameHere' do
       # ...
      
    +  use_unimodules!

       # ...
     end
    ```

  in the end your `Podfile` should look more or less like [this](https://github.com/expo/expo/blob/master/templates/expo-template-bare-minimum/ios/Podfile).
- Run `npx pod-install` again
- Setup `@unimodules/react-native-adapter` following instructions at [README.md](../%40unimodules/react-native-adapter#ios).
- Configure your `AppDelegate` to extend `UMAppDelegateWrapper`:
  - Import `<UMCore/UMAppDelegateWrapper.h>` in `AppDelegate.h`:
    ```diff
     #import <React/RCTBridgeDelegate.h>
     #import <UIKit/UIKit.h>
    +
    +#import <UMCore/UMAppDelegateWrapper.h>
     
     @interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>
    ```
  - Change the superclass of your AppDelegate to `UMAppDelegateWrapper`:
    ```diff
     #import <React/RCTBridgeDelegate.h>
     #import <UIKit/UIKit.h>
     
     #import <UMCore/UMAppDelegateWrapper.h>
     
    -@interface AppDelegate : UIResponder <UIApplicationDelegate, RCTBridgeDelegate>
    +@interface AppDelegate : UMAppDelegateWrapper <UIApplicationDelegate, RCTBridgeDelegate>
    ```
- Configure your `AppDelegate` to call the superclass implementation whenever applicable:
  - For every `-application:…` method implemented by your `AppDelegate` in `AppDelegate.m` add a call to `super` before returning from the function. For example:
    ```diff
     - (BOOL)application:(UIApplication *)application didFinishLaunchingWithOptions:(NSDictionary *)launchOptions
     {
     // ... some code
     
       RCTBridge *bridge = [[RCTBridge alloc] initWithDelegate:self launchOptions:launchOptions];
       RCTRootView *rootView = [[RCTRootView alloc] initWithBridge:bridge
                                                       moduleName:@"HelloWorld"
                                                 initialProperties:nil];

       rootView.backgroundColor = [[UIColor alloc] initWithRed:1.0f green:1.0f blue:1.0f alpha:1];
       
       self.window = [[UIWindow alloc] initWithFrame:[UIScreen mainScreen].bounds];
       UIViewController *rootViewController = [UIViewController new];
       rootViewController.view = rootView;
       self.window.rootViewController = rootViewController;
       [self.window makeKeyAndVisible];

    +  [super application:application didFinishLaunchingWithOptions:launchOptions];
       return YES;
     }
    ```

    or

    ```diff
     - (BOOL)application:(UIApplication *)app openURL:(NSURL *)url options:(NSDictionary<UIApplicationOpenURLOptionsKey,id> *)options
     {
       // ... some code, probably returning if some condition is met

    -  return NO;
    +  return [super application:app openURL:url options:options];
     }
    ```

    in the end your `AppDelegate.h` and `AppDelegate.m` should look more or less like these: [`AppDelegate.h`](https://github.com/expo/expo/blob/master/templates/expo-template-bare-minimum/ios/HelloWorld/AppDelegate.h), [`AppDelegate.m`](https://github.com/expo/expo/blob/master/templates/expo-template-bare-minimum/ios/HelloWorld/AppDelegate.m).

### Advanced configuration

<details><summary>Need to customize node_modules path?</summary>
<p>

If you need to customize the path to node_modules, for example because you are using yarn workspaces, then you can pass in a param for this: `use_unimodules!(modules_paths: ['./path/to/node_modules'])`

</p>
</details>

<details><summary>Need to exclude some unimodules that are being automatically linked?</summary> 
<p>

If you need to exclude some of the unimodules that you are not using but they got installed by your other dependencies (like `expo`), then you can pass in `exclude` param for this. For example, if you want to exclude `expo-face-detector`, you may want to use this: `use_unimodules!(exclude: ['expo-face-detector'])`

</p>
</details>

## 🤖 Configure Android

**In `android/settings.gradle`**

1. At the top add `apply from: '../node_modules/react-native-unimodules/gradle.groovy'`
1. Then call `includeUnimodulesProjects()` on the next line.

**In `android/app/build.gradle`**

1. Add `apply from: '../../node_modules/react-native-unimodules/gradle.groovy'` anywhere before the `dependencies {}` block.
1. Add `addUnimodulesDependencies()` inside `dependencies {}` block.
1. We recommend you use Java 1.8, you can set this [like this](https://github.com/expo/expo/commit/e175f870418fc69e8c129168118264439d73d7cc).

**In `android/build.gradle`**

1. Update `minSdkVersion` to `21`.

**In `MainApplication.java`**
Make the changes outlined in the diff that correspondes to your react-native version.

- [this diff for react-native <= 0.59](https://gist.github.com/mczernek/0670ec16ca6071796853a66d589b49a5/revisions#diff-a2e7ff8a82f1c4be06f8b8163f2afefa)
- [this diff for react-native >= 0.60](https://gist.github.com/mczernek/9de9e184abc430e9e3508d26738c8a14/revisions#diff-a2e7ff8a82f1c4be06f8b8163f2afefa)

### Advanced configuration

<details><summary>Need to customize node_modules path?</summary>
<p>

If you need to customize the path to node_modules, for example because you are using yarn workspaces, then you can pass in a param `modulesPaths` for both of these functions: `includeUnimodulesProjects([modulesPaths: ['./path/to/node_modules']])`, `addUnimodulesDependencies([modulesPaths: ['./path/to/node_modules']])`

</p>
</details>

<details><summary>Need to exclude some unimodules that are being automatically linked?</summary>
<p>

If you need to exclude some of the unimodules that you are not using but they got installed by your other dependencies (like `expo`), then you can pass in `exclude` param for this. For example, if you want to exclude `expo-face-detector`, you may want to use this: `addUnimodulesDependencies([exclude: ['expo-face-detector']])`

</p>
</details>

<details><summary>Need to customize configuration of unimodule dependencies?</summary>
<p>

You can also customize the configuration of the unimodules dependencies (the default is `implementation`, if you're using Gradle older than 3.0, you will need to set `configuration: "compile"` in `addUnimodulesDependencies`, like: `addUnimodulesDependencies([configuration: "compile"])`)

</p>
</details>

# API

It's possible that you will not have to use any of the code provided by this package directly, it may be used only by other Unimodules that you install.

But it's likely that you will want to use something like FileSystem or Permissions, and to do that you can import the following modules like so:

```js
import { Asset, Constants, FileSystem, Permissions } from 'react-native-unimodules';
```

You can import them directly from the specific Unimodule package if you like, but your linter may complain about importing a transitive dependency.

```js
import * as Permissions from 'expo-permissions';
```
