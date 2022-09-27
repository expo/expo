---
title: Developing With ExpoKit
---

> ExpoKit is deprecated and is no longer supported after SDK 38. If you need to make customizations to your Expo project, we recommend using the [bare workflow](../workflow/customizing.md) instead.

ExpoKit is an Objective-C and Java library that allows you to use the Expo platform with a
native iOS/Android project.

## Before you read this guide

To create an ExpoKit project:

1.  Create a pure-JS project with Expo CLI (also projects that were created with exp, XDE or create-react-native-app will work)
2.  Then use [`expo eject`](eject.md) to add ExpoKit (choose the "ExpoKit" option).

Make sure to perform these steps before continuing in this guide. The remainder of the guide will assume you have created an ExpoKit project.

## Setting up your project

By this point you should have a JS app which additionally contains `ios` and `android` directories.

### 1. Check JS dependencies

- Your project's **package.json** should contain a `react-native` dependency pointing at Expo's fork of React Native. This should already be configured for you.
- Your JS dependencies should already be installed (via `npm install` or `yarn`).

### 2. Run the project with Expo CLI

Run `expo start` from the project directory.

This step ensures that the Metro bundler is running and serving your app's JS bundle for development. Leave this running and continue with the following steps.

> Note: Before building for release, you **must** run the Classic Update's `expo publish` command to serve your app's JS bundle in TestFlight and production.

### 3. iOS: Configure, build and run

This step ensures the native iOS project is correctly configured and ready for development.

- Make sure you have the latest Xcode.
- Run `npx pod-install` to link the native iOS packages
- Open your project's `xcworkspace` file in Xcode.
- Use Xcode to build, install and run the project on your test device or simulator. (this will happen by default if you click the big "Play" button in Xcode.)

Once it's running, the iOS app should automatically request your JS bundle from the project you're serving from Expo CLI.

### 4. Android: Build and run

Open the **android** directory in Android Studio, then build and run the project on an Android device or emulator.

When opening the project, Android Studio may prompt you to upgrade the version of Gradle or other build tools, but don't do this as you may get unexpected results. ExpoKit always ships with the latest supported versions of all build tools.

If you prefer to use the command line, you can run `./gradlew installDebug` from inside the **android** directory to build the project and install it on the running device/emulator.

Once the Android project is running, it should automatically request your development url from Expo CLI. You can develop your project normally from here.

## Continuing with development

Every time you want to develop, ensure your project's JS is being served by Expo CLI (step 2), then run the native code from Xcode or Android Studio respectively.

Your ExpoKit project is configured to load your app's published url when you build it for release. So when you want to release it, don't forget to publish, like with any normal (non-ExpoKit) project.

## Changing Native Dependencies

### iOS

Your ExpoKit project manages its dependencies with [CocoaPods](https://cocoapods.org).

Many libraries in the React Native ecosystem include instructions to run `react-native link`. These are supported with ExpoKit for iOS.

- If the library supports CocoaPods (has a .podspec file), just follow the normal instructions and run `react-native link`.
- If the library doesn't support CocoaPods, `react-native link` may fail to include the library's header files. If you encounter build issues locating the `<React/*>` headers, you may need to manually add `Pods/Headers/Public` to the **Header Search Paths** configuration for your native dependency in Xcode. If you're not familiar with Xcode, search Xcode help for "configure build settings" to get an idea of how those work. **Header Search Paths** is one such build setting. The target you care to configure is the one created by `react-native link` inside your Xcode project. You'll want to determine the relative path from your library to `Pods/Headers/Public`.

### Android

Many libraries in the React Native ecosystem include instructions to run `react-native link`. These are supported with ExpoKit for Android.

## Upgrading ExpoKit

ExpoKit's release cycle follows the Expo SDK release cycle. When a new version of the Expo SDK comes out, the release notes include upgrade instructions for the normal, JS-only part of your project. Additionally, you'll need to update the native ExpoKit code.

> **Note:** Please make sure you've already updated your JS dependencies before proceeding with the following instructions. Additionally, there may be version-specific breaking changes not covered here.

### iOS

- Open up `ios/Podfile` in your project, and update the `ExpoKit` tag to point at the [release](https://github.com/expo/expo/releases) corresponding to your SDK version. Run `pod update` then `pod install`.
- Open `ios/your-project/Supporting/EXSDKVersions.plist` in your project and change all the values to the new SDK version.
- Install or upgrade `react-native-unimodules@^0.7.0` in your project (`yarn add -D react-native-unimodules@^0.7.0` or `npm install --save-dev react-native-unimodules@^0.7.0` if you prefer npm over Yarn).

Additionally, if upgrading from SDK 35 or below:

- Replace

```ruby
pod 'React',
(...)
  pod 'glog',
    :podspec => "#{react_native_path}/third-party-podspecs/glog.podspec",
    :inhibit_warnings => true
```

with

```ruby
 # Install React Native and its dependencies
 require_relative '../node_modules/react-native/scripts/autolink-ios.rb'
 use_react_native!
```

If upgrading from SDK 32 or below:

1.  If you haven't already done so install `react-native-unimodules@^0.7.0` in your project (`yarn add -D react-native-unimodules@^0.7.0` or `npm install --save-dev react-native-unimodules@^0.7.0` if you prefer npm over Yarn).
2.  Remove the list of unimodules' dependencies:
    ```ruby
      pod 'EXAdsAdMob',
        :path => "../node_modules/expo-ads-admob/ios"
      pod 'EXSegment',
        :path => "../node_modules/expo-analytics-segment/ios"
      pod 'EXAppAuth',
        :path => "../node_modules/expo-app-auth/ios"
      # and so on...
    ```
    and instead add:
    ```ruby
      # Install unimodules
      require_relative '../node_modules/react-native-unimodules/cocoapods.rb'
      use_unimodules!
    ```
    This will introduce your project to autoinstallable unimodules. More information can be found on the [`react-native-unimodules` repository](https://github.com/expo/expo/tree/main/packages/react-native-unimodules).
3.  Upgrade CocoaPods to some version higher or equal 1.6. (At the moment of writing the latest version is 1.7.1, we have tested it works. You will probably need to run `gem update cocoapods`, but the exact command will depend on your setup.)
4.  Change the whole `post_install` block at the bottom of the `Podfile` to

    ```ruby
    post_install do |installer|
      installer.pods_project.main_group.tab_width = '2';
      installer.pods_project.main_group.indent_width = '2';

      installer.target_installation_results.pod_target_installation_results
        .each do |pod_name, target_installation_result|

        if pod_name == 'ExpoKit'
          target_installation_result.native_target.build_configurations.each do |config|
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'EX_DETACHED=1'

            # Enable Google Maps support
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'HAVE_GOOGLE_MAPS=1'
            config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'HAVE_GOOGLE_MAPS_UTILS=1'
          end
        end

         if ['Amplitude','Analytics','AppAuth','Branch','CocoaLumberjack','FBSDKCoreKit','FBSDKLoginKit','FBSDKShareKit','GPUImage','JKBigInteger2'].include? pod_name
           target_installation_result.native_target.build_configurations.each do |config|
             config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '10.0'
           end
         end

         # Can't specify this in the React podspec because we need to use those podspecs for detached
         # projects which don't reference ExponentCPP.
         if pod_name.start_with?('React')
           target_installation_result.native_target.build_configurations.each do |config|
             config.build_settings['IPHONEOS_DEPLOYMENT_TARGET'] = '10.0'
             config.build_settings['HEADER_SEARCH_PATHS'] ||= ['$(inherited)']
           end
         end

         # Build React Native with RCT_DEV enabled and RCT_ENABLE_INSPECTOR and
         # RCT_ENABLE_PACKAGER_CONNECTION disabled
         next unless pod_name == 'React'
         target_installation_result.native_target.build_configurations.each do |config|
           config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] ||= ['$(inherited)']
           config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'RCT_DEV=1'
           config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'RCT_ENABLE_INSPECTOR=0'
           config.build_settings['GCC_PREPROCESSOR_DEFINITIONS'] << 'ENABLE_PACKAGER_CONNECTION=0'
         end

      end
    end
    ```

If upgrading from SDK 31 or below, you'll need to refactor your `AppDelegate` class as we moved its Expo-related part to a separate `EXStandaloneAppDelegate` class owned by `ExpoKit` to simplify future upgrade processes as much as possible. As of SDK 32, your `AppDelegate` class needs to subclass `EXStandaloneAppDelegate`.

If you have never made any edits to your Expo-generated `AppDelegate` files, then you can just replace them with these new template files:

- [AppDelegate.h](https://github.com/expo/expo/tree/main/exponent-view-template/ios/exponent-view-template/AppDelegate.h)
- [AppDelegate.m](https://github.com/expo/expo/tree/main/exponent-view-template/ios/exponent-view-template/AppDelegate.m)

If you override any `AppDelegate` methods to add custom behavior, you'll need to either refactor your `AppDelegate` to subclass `EXStandaloneAppDelegate` and call `super` methods when necessary, or start with the new template files above and add your custom logic again (be sure to keep the calls to `super` methods).

If upgrading from SDK 30 or below, you'll also need to change `platform :ios, '9.0'` to `platform :ios, '10.0'` in `ios/Podfile`.

### Android

- Go to https://expo.dev/--/api/v2/versions and find the `expokitNpmPackage` key under `sdkVersions.[NEW SDK VERSION]`.
- Update your version of expokit in **package.json** to the version in `expokitNpmPackage` and yarn/npm install.
- If upgrading to SDK 31 or below, go to **MainActivity.java** and replace `Arrays.asList("[OLD SDK VERSION]")` with `Arrays.asList("[NEW SDK VERSION]")`. If upgrading to SDK 32 or above, simply remove the entire `public List<String> sdkVersions()` method from **MainActivity.java**.
- Go to `android/app/build.gradle` and replace `compile('host.exp.exponent:expoview:[OLD SDK VERSION]@aar') {` with `compile('host.exp.exponent:expoview:[NEW SDK VERSION]@aar') {`.
- Go to `android/app/build.gradle` (same file) and replace `api 'com.facebook.react:react-native:[OLD SDK VERSION]'` with `api 'com.facebook.react:react-native:[NEW SDK VERSION]'`.
- Go to `android/app/build.gradle` (same file) and upgrade JSC version by replacing `api 'org.webkit:android-jsc:[OLD JSC VERSION]'` with `api 'org.webkit:android-jsc:r245459'` and `force 'org.webkit:android-jsc:[OLD JSC VERSION]'` with `force 'org.webkit:android-jsc:r245459'`.

If upgrading from SDK34:

1. Remove or comment out the following three lines in android/app/build.gradle as they are no longer used:

```
 annotationProcessor 'com.raizlabs.android:DBFlow-Compiler:2.2.1'
 implementation "com.raizlabs.android:DBFlow-Core:2.2.1"
 implementation "com.raizlabs.android:DBFlow:2.2.1"
```

If upgrading from SDK32 or below:

1. If you haven't already done so when upgrading your iOS project, install `react-native-unimodules@^0.7.0` in your project (`yarn add -D react-native-unimodules@^0.7.0` or `npm install --save-dev react-native-unimodules@^0.7.0` if you prefer npm over Yarn).
2. In `android/settings.gradle` add to the bottom of the file:

   ```groovy
   apply from: '../node_modules/react-native-unimodules/gradle.groovy'

   // Include unimodules.
   includeUnimodulesProjects()
   ```

3. In `android/app/build.gradle` remove an explicit list of `host.exp.exponent:…` dependencies with

   ```groovy
   addUnimodulesDependencies([
     modulesPaths : [
       '../../node_modules'
     ],
     configuration: 'api',
     target       : 'react-native',
     exclude      : [
       // You can exclude unneeded modules here, e.g.,
       // 'unimodules-face-detector-interface',
       // 'expo-face-detector'

       // Adding a name here will also remove the package
       // from auto-generated BasePackageList.java
     ]
   ])
   ```

4. In `android/app/build.gradle` (same file) add the following line above `dependencies {` line
   ```groovy
   apply from: "../../node_modules/react-native-unimodules/gradle.groovy"
   ```
5. In `android/app/build.gradle` (same file) replace all occurrences of `27.1.1` with `28.0.0`.
6. In `android/app/build.gradle` (same file) replace `compileSdkVersion 27` with `compileSdkVersion 28`.
7. In `android/app/build.gradle` (same file) if you have the line:
   ```groovy
   implementation 'expolib_v1.com.google.android.exoplayer:expolib_v1-extension-okhttp:2.6.1@aar'
   ```
   change it to
   ```groovy
   implementation 'com.google.android.exoplayer:extension-okhttp:2.6.1'
   ```
8. In `android/app/build.gradle` (same file) add the following block to the end of `android { … <add here> }`:
   ```groovy
   compileOptions {
     sourceCompatibility 1.8
     targetCompatibility 1.8
   }
   ```
9. In `android/app/src/main/java/host/exp/exponent/MainApplication.java` change
   ```java
   import expolib_v1.okhttp3.OkHttpClient;
   ```
   to
   ```java
   import okhttp3.OkHttpClient;
   ```
10. In both `android/app/src/main/java/host/exp/exponent/MainApplication.java` and `android/app/src/main/java/host/exp/exponent/MainActivity.java` change
    ```java
    import expo.core.interfaces.Package;
    ```
    to
    ```java
    import org.unimodules.core.interfaces.Package;
    ```
11. In `android/app/src/main/java/host/exp/exponent/MainApplication.java` change:
    ```java
    // only expo.modules!
    import expo.modules.ads.admob.AdMobPackage;
    import expo.modules.analytics.segment.SegmentPackage;
    import expo.modules.appauth.AppAuthPackage;
    import expo.modules.backgroundfetch.BackgroundFetchPackage;
    ```
    to
    ```java
    import host.exp.exponent.generated.BasePackageList;
    ```
    and
    ```java
    public List<Package> getExpoPackages() {
      return Arrays.<Package>asList(
          // ... package
      );
    }
    ```
    to
    ```java
    public List<Package> getExpoPackages() {
      return new BasePackageList().getPackageList();
    }
    ```
12. From `android/app/src/main/java/host/exp/exponent/MainApplication.java` remove the following method:
    ```java
    @Override
    public boolean shouldUseInternetKernel() {
      return BuildVariantConstants.USE_INTERNET_KERNEL;
    }
    ```
13. Remove `android/app/src/devKernel` and `android/app/src/prodKernel` directories.
14. From `android/app/build.gradle` remove:
    ```groovy
    flavorDimensions 'remoteKernel'
    productFlavors {
      devKernel {
        dimension 'remoteKernel'
      }
      prodKernel {
        dimension 'remoteKernel'
      }
    }
    ```
    If you used Gradle tasks anywhere in your custom code you'll need to remove `DevKernel` and `ProdKernel` parts of task names, so e.g., `:app:installDevKernelDebug` becomes `:app:installDebug`.

If upgrading from SDK31 or below:

1. add the following lines to `android/app/build.gradle`:

   ```groovy
   api 'host.exp.exponent:expo-app-loader-provider:+'
   api 'org.unimodules:core:+'
   api 'org.unimodules:unimodules-constants-interface:+'
   api 'host.exp.exponent:expo-constants:+'
   api 'org.unimodules:unimodules-file-system-interface:+'
   api 'host.exp.exponent:expo-file-system:+'
   api 'org.unimodules:unimodules-image-loader-interface:+'
   api 'host.exp.exponent:expo-permissions:+'
   api 'org.unimodules:unimodules-permissions-interface:+'
   api 'org.unimodules:unimodules-sensors-interface:+'
   api 'host.exp.exponent:expo-react-native-adapter:+'
   api 'host.exp.exponent:expo-task-manager:+'
   api 'org.unimodules:unimodules-task-manager-interface:+'

   // Optional universal modules, could be removed
   // along with references in MainActivity
   api 'host.exp.exponent:expo-ads-admob:+'
   api 'host.exp.exponent:expo-app-auth:+'
   api 'host.exp.exponent:expo-analytics-segment:+'
   api 'org.unimodules:unimodules-barcode-scanner-interface:+'
   api 'host.exp.exponent:expo-barcode-scanner:+'
   api 'org.unimodules:unimodules-camera-interface:+'
   api 'host.exp.exponent:expo-camera:+'
   api 'host.exp.exponent:expo-contacts:+'
   api 'host.exp.exponent:expo-face-detector:+'
   api 'org.unimodules:unimodules-face-detector-interface:+'
   api 'host.exp.exponent:expo-font:+'
   api 'host.exp.exponent:expo-gl-cpp:+'
   api 'host.exp.exponent:expo-gl:+'
   api 'host.exp.exponent:expo-local-authentication:+'
   api 'host.exp.exponent:expo-localization:+'
   api 'host.exp.exponent:expo-location:+'
   api 'host.exp.exponent:expo-media-library:+'
   api 'host.exp.exponent:expo-print:+'
   api 'host.exp.exponent:expo-sensors:+'
   api 'host.exp.exponent:expo-sms:+'
   api 'host.exp.exponent:expo-background-fetch:+'
   ```

2. Ensure that in **MainActivity.java**, `expoPackages` method looks like this:
   ```java
   @Override
   public List<Package> expoPackages() {
     return ((MainApplication) getApplication()).getExpoPackages();
   }
   ```
3. In **MainApplication.java**, replace
   ```java
   public class MainApplication extends ExpoApplication {
   ```
   with
   ```java
   public class MainApplication extends ExpoApplication implements AppLoaderPackagesProviderInterface<ReactPackage> {
   ```
4. Add the following lines in **MainApplication.java**:

   ```java
   import org.unimodules.core.interfaces.Package;
   import expo.loaders.provider.interfaces.AppLoaderPackagesProviderInterface;
   import expo.modules.ads.admob.AdMobPackage;
   import expo.modules.analytics.segment.SegmentPackage;
   import expo.modules.appauth.AppAuthPackage;
   import expo.modules.backgroundfetch.BackgroundFetchPackage;
   import expo.modules.barcodescanner.BarCodeScannerPackage;
   import expo.modules.camera.CameraPackage;
   import expo.modules.constants.ConstantsPackage;
   import expo.modules.contacts.ContactsPackage;
   import expo.modules.facedetector.FaceDetectorPackage;
   import expo.modules.filesystem.FileSystemPackage;
   import expo.modules.font.FontLoaderPackage;
   import expo.modules.gl.GLPackage;
   import expo.modules.google.signin.GoogleSignInPackage;
   import expo.modules.localauthentication.LocalAuthenticationPackage;
   import expo.modules.localization.LocalizationPackage;
   import expo.modules.location.LocationPackage;
   import expo.modules.medialibrary.MediaLibraryPackage;
   import expo.modules.permissions.PermissionsPackage;
   import expo.modules.print.PrintPackage;
   import expo.modules.sensors.SensorsPackage;
   import expo.modules.sms.SMSPackage;
   import expo.modules.taskManager.TaskManagerPackage;

   ...

   public List<Package> getExpoPackages() {
     return Arrays.<Package>asList(
         new CameraPackage(),
         new ConstantsPackage(),
         new SensorsPackage(),
         new FileSystemPackage(),
         new FaceDetectorPackage(),
         new GLPackage(),
         new GoogleSignInPackage(),
         new PermissionsPackage(),
         new SMSPackage(),
         new PrintPackage(),
         new MediaLibraryPackage(),
         new SegmentPackage(),
         new FontLoaderPackage(),
         new LocationPackage(),
         new ContactsPackage(),
         new BarCodeScannerPackage(),
         new AdMobPackage(),
         new LocalAuthenticationPackage(),
         new LocalizationPackage(),
         new AppAuthPackage(),
         new TaskManagerPackage(),
         new BackgroundFetchPackage()
     );
   }
   ```

If upgrading from SDK 30 or below, remove the following lines from `android/app/build.gradle`:

```groovy
implementation 'com.squareup.okhttp3:okhttp:3.4.1'
implementation 'com.squareup.okhttp3:okhttp-urlconnection:3.4.1'
implementation 'com.squareup.okhttp3:okhttp-ws:3.4.1'
```

If upgrading from SDK 28 or below, you'll also need to follow these instructions:

- Change all instances of `android\\detach-scripts` and `android/detach-scripts` to `node_modules\\expokit\\detach-scripts` and `node_modules/expokit/detach-scripts` respectively in `android/app/expo.gradle`.
- Add `maven { url "$rootDir/../node_modules/expokit/maven" }` under `allprojects.repositories` in `android/build.gradle`.
- In `android/app/build.gradle`, replace

```groovy
compile('host.exp.exponent:expoview:[SDK VERSION]@aar') {
  transitive = true
}
```

with

```groovy
compile('host.exp.exponent:expoview:[SDK VERSION]@aar') {
  transitive = true
  exclude group: 'com.squareup.okhttp3', module: 'okhttp'
  exclude group: 'com.squareup.okhttp3', module: 'okhttp-urlconnection'
}
```
