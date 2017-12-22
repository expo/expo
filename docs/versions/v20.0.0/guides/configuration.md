---
title: Configuration with app.json
---

`app.json` is your go-to place for configuring parts of your app that don't belong in code. It is located at the root of your project next to your `package.json`. It looks something like this:

```
{
  "expo": {
    "name": "My app",
    "slug": "my-app",
    "sdkVersion": "20.0.0",
    "privacy": "public"
  }
}
```

`app.json` was previous referred to as `exp.json`, but for consistency with [Create React Native App](https://github.com/react-community/create-react-native-app) it has been consolidated under one file. If you are converting your app from using `exp.json` to `app.json`, all you need to do is add an `"expo"` key at the root of `app.json`, as the parent of all other keys.

Most configuration from `app.json` is accessible at runtime from your JavaScript code via [`Expo.Constants.manifest`](../sdk/constants.html#expoconstantsmanifest). Sensitive information such as secret keys are removed. See the `"extra"` key below for information about how to pass arbitrary configuration data to your app.

The following is a list of properties that are available for you under the `"expo"` key in `app.json`:



- `name`

   **Required**. The name of your app as it appears both within Expo and on your home screen as a standalone app.

- `description`

   A short description of what your app is and why it is great.

- `slug`

   **Required**. The friendly url name for publishing. eg: `expo.io/@your-username/slug`.

- `privacy`

   Either `public` or `unlisted`. If not provided, defaults to `unlisted`. In the future `private` will be supported. `unlisted` hides the experience from search results.
 Valid values: 'public', 'unlisted'

- `sdkVersion`

   **Required**. The Expo sdkVersion to run the project on. This should line up with the version specified in your package.json.

- `version`

   Your app version, use whatever versioning scheme that you like.

- `orientation`

   Lock your app to a specific orientation with `portrait` or `landscape`. Defaults to no lock.
 Valid values: 'default', 'portrait', 'landscape'

- `primaryColor`

   On Android, this will determine the color of your app in the multitasker. Currently this is not used on iOS, but it may be used for other purposes in the future.
 6 character long hex color string, eg: `'#000000'`

- `icon`

   Local path or remote url to an image to use for your app's icon. We recommend that you use a 512x512 png file with transparency. This icon will appear on the home screen and within the Expo app.

- `notification`

   Configuration for remote (push) notifications.

   - `icon`

      Local path or remote url to an image to use as the icon for push notifications. 48x48 png grayscale with transparency.

   - `color`

      Tint color for the push notification image when it appears in the notification tray.
    6 character long hex color string, eg: `'#000000'`

   - `androidMode`

      Show each push notification individually (`default`) or collapse into one (`collapse`).
    Valid values: 'default', 'collapse'

   - `androidCollapsedTitle`

      If `androidMode` is set to `collapse`, this title is used for the collapsed notification message. eg: `'#{unread_notifications} new interactions'`.

- `loading`

   Configuration for the loading screen that users see when opening your app, while fetching & caching bundle and assets.

   - `icon`

      Local path or remote url to an image to display while starting up the app. Image size and aspect ratio are up to you. Must be a .png.

   - `exponentIconColor`

      If no icon is provided, we will show the Expo logo. You can choose between `white` and `blue`.
    Valid values: 'white', 'blue'

   - `exponentIconGrayscale`

      Similar to `exponentIconColor` but instead indicate if it should be grayscale (`1`) or not (`0`).

   - `backgroundImage`

      Local path or remote url to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png.

   - `backgroundColor`

      Color to fill the loading screen background
    6 character long hex color string, eg: `'#000000'`

   - `hideExponentText`

      By default, Expo shows some text at the bottom of the loading screen. Set this to `true` to disable.

   - `splash`

      Configuration for loading and splash screen for standalone apps.

       - `backgroundColor`

          Color to fill the loading screen background
        6 character long hex color string, eg: `'#000000'`

       - `image`

          Properties for customizing the images on the splash and loading screen for standalone apps.

           - `ios`

              Image specific properties for the loading experience on iOS standalone apps.

               - `backgroundImage`

                  Local path or remote url to an image to fill the background of the loading screen. Image size and aspect ratio are up to you. Must be a .png. Will be inserted into the loading screen's background image view with contentMode `aspectFill`.

- `appKey`

   By default, Expo looks for the application registered with the AppRegistry as `main`. If you would like to change this, you can specify the name in this property.

- `androidStatusBarColor`

    6 character long hex color string, eg: `'#000000'`

- `androidStatusBar`

   Configuration for android statusbar.

   - `barStyle`

      Configure the statusbar icons to have light or dark color.
    Valid values: 'light-content', 'dark-content'

   - `backgroundColor`

      Configuration for android statusbar.
    6 character long hex color string, eg: `'#000000'`

- `androidShowExponentNotificationInShellApp`

   Adds a notification to your standalone app with refresh button and debug info.

- `scheme`

   **Standalone Apps Only**. Url scheme to link into your app. For example, if we set this to `'rnplay'`, then rnplay:// urls would open your app when tapped.

- `entryPoint`

   The relative path to your main JavaScript file.

- `extra`

   Any extra fields you want to pass to your experience. Values are accessible via `Expo.Constants.manifest.extra` ([read more](../sdk/constants.html#expoconstantsmanifest))

- `rnCliPath`

   
- `packagerOpts`

   
- `ignoreNodeModulesValidation`

   
- `nodeModulesPath`

   
- `ios`

   **Standalone Apps Only**. iOS standalone app specific configuration

   - `bundleIdentifier`

      The bundle identifier for your iOS standalone app. You make it up, but it needs to be unique on the App Store. See [this StackOverflow question](http://stackoverflow.com/questions/11347470/what-does-bundle-identifier-mean-in-the-ios-project).
    iOS bundle identifier notation unique name for your app. For example, host.exp.exponent, where exp.host is our domain and Expo is our app.

   - `buildNumber`

      Build number for your iOS standalone app. Must be a string that matches Apple's [format for CFBundleVersion](https://developer.apple.com/library/content/documentation/General/Reference/InfoPlistKeyReference/Articles/CoreFoundationKeys.html#//apple_ref/doc/uid/20001431-102364).

   - `icon`

      Local path or remote url to an image to use for your app's icon on iOS. If specified, this overrides the top-level `icon` key. iOS icons should be square png files with no transparent pixels. This icon will appear on the home screen and within the Expo app.

   - `merchantId`

      Merchant ID for use with Apple Pay in your standalone app.

   - `config`

      
       - `branch`

          [Branch](https://branch.io/) key to hook up Branch linking services.

           - `apiKey`

              Your Branch API key

       - `usesNonExemptEncryption`

          Sets `ITSAppUsesNonExemptEncryption` in the standalone ipa's Info.plist to the given boolean value.

       - `googleMapsApiKey`

          [Google Maps iOS SDK](https://developers.google.com/maps/documentation/ios-sdk/start) key for your standalone app.

       - `googleSignIn`

          [Google Sign-In iOS SDK](https://developers.google.com/identity/sign-in/ios/start-integrating) keys for your standalone app.

           - `reservedClientId`

              The reserved client id url scheme. Can be found in `GoogeService-Info.plist`.

   - `isRemoteJSEnabled`

      If set to false, your standalone app will never download any code, and will only use code bundled locally on the device. In that case, all updates to your app must be submitted through Apple review. Defaults to true. (Note that this will not work out of the box with ExpoKit projects)

   - `supportsTablet`

      Whether your standalone iOS app supports tablet screen sizes.

   - `isTabletOnly`

      If true, indicates that your standalone iOS app does not support handsets, and only supports tablets.

   - `infoPlist`

      Dictionary of arbitrary configuration to add to your standalone app's native Info.plist. Applied prior to all other Expo-specific configuration. No other validation is performed, so use this at your own risk of rejection from the App Store.

   - `associatedDomains`

      An array that contains Associated Domains for the standalone app.

   - `usesIcloudStorage`

      A boolean indicating if the app uses iCloud Storage for DocumentPicker. See DocumentPicker docs for details.

- `android`

   **Standalone Apps Only**. Android standalone app specific configuration

   - `package`

      The package name for your Android standalone app. You make it up, but it needs to be unique on the Play Store. See [this StackOverflow question](http://stackoverflow.com/questions/6273892/android-package-name-convention).
    Reverse DNS notation unique name for your app. For example, host.exp.exponent, where exp.host is our domain and Expo is our app.

   - `versionCode`

      Version number required by Google Play. Increment by one for each release. https://developer.android.com/studio/publish/versioning.html.

   - `icon`

      Local path or remote url to an image to use for your app's icon. We recommend that you use a 512x512 png file with transparency. This icon will appear on the home screen and within the Expo app.

   - `permissions`

      List of permissions used by the standalone app. Remove the field to use the default list of permissions.
    
      Example: `[ "CAMERA", "ACCESS_FINE_LOCATION" ]`.
    
      You can specify the following permissions depending on what you need:
    
      - `ACCESS_COARSE_LOCATION`
      - `ACCESS_FINE_LOCATION`
      - `CAMERA`
      - `MANAGE_DOCUMENTS`
      - `READ_CONTACTS`
      - `READ_EXTERNAL_STORAGE`
      - `READ_INTERNAL_STORAGE`
      - `READ_PHONE_STATE`
      - `RECORD_AUDIO`
      - `USE_FINGERPRINT`
      - `VIBRATE`
      - `WAKE_LOCK`
      - `WRITE_EXTERNAL_STORAGE`
      - `com.anddoes.launcher.permission.UPDATE_COUNT`
      - `com.android.launcher.permission.INSTALL_SHORTCUT`
      - `com.google.android.c2dm.permission.RECEIVE`
      - `com.google.android.gms.permission.ACTIVITY_RECOGNITION`
      - `com.google.android.providers.gsf.permission.READ_GSERVICES`
      - `com.htc.launcher.permission.READ_SETTINGS`
      - `com.htc.launcher.permission.UPDATE_SHORTCUT`
      - `com.majeur.launcher.permission.UPDATE_BADGE`
      - `com.sec.android.provider.badge.permission.READ`
      - `com.sec.android.provider.badge.permission.WRITE`
      - `com.sonyericsson.home.permission.BROADCAST_BADGE`

   - `config`

      
       - `branch`

          [Branch](https://branch.io/) key to hook up Branch linking services.

           - `apiKey`

              Your Branch API key

       - `fabric`

          [Google Developers Fabric](https://get.fabric.io/) keys to hook up Crashlytics and other services.

           - `apiKey`

              Your Fabric API key

           - `buildSecret`

              Your Fabric build secret

       - `googleMaps`

          [Google Maps Android SDK](https://developers.google.com/maps/documentation/android-api/signup) key for your standalone app.

           - `apiKey`

              Your Google Maps Android SDK API key

       - `googleSignIn`

          [Google Sign-In Android SDK](https://developers.google.com/identity/sign-in/android/start-integrating) keys for your standalone app.

           - `apiKey`

              The Android API key. Can be found in the credentials section of the developer console or in `google-services.json`.

           - `certificateHash`

              The SHA-1 hash of the signing certificate used to build the apk without any separator `:`. Can be found in `google-services.json`. https://developers.google.com/android/guides/client-auth

- `facebookScheme`

   Used for Facebook native login. Starts with 'fb' and followed by a string of digits, like 'fb1234567890'. You can find your scheme at https://developers.facebook.com/docs/facebook-login/ios in the 'Configuring Your info.plist' section.

- `hooks`

   Configuration for scripts to run to hook into the publish process

   - `postPublish`

      