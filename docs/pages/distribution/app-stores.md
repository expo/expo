---
title: Deploying to App Stores
---

import { ConfigClassic } from '~/components/plugins/ConfigSection';

This guide offers best practices around submitting your Expo app to the Apple App Store and Google Play Store. To learn how to generate native binaries for submission, refer to ["Creating your first build"](../build/setup.md).

Although you can share your published project through the Expo Go app and on your [expo.dev](https://expo.dev) profile, submitting a standalone app to the Apple and Google stores is necessary to have a dedicated piece of real estate on your users' devices. Submitting to these stores carries stronger requirements and quality standards than sharing a toy project with a few friends, because it makes your app available through a much wider distribution platform.

**Disclaimer:** Especially in the case of Apple, review guidelines and rules change all the time, and Apple's enforcement of various rules tends to be finicky and inconsistent. We can't guarantee that your particular project will be accepted by either platform, and you are ultimately responsible for your app's behavior. However, Expo apps are native apps and behave just like any other apps, so if you've created something awesome, you should have nothing to worry about!

## Make sure your app works on many form factors

It's a good idea to test your app on a device or simulator with a small screen (e.g. an iPhone SE) as well as a large screen (e.g. an iPhone X). Ensure your components render the way you expect, no buttons are blocked, and all text fields are accessible.

Try your app on tablets in addition to handsets. Even if you have `ios.supportsTablet: false` configured, your app will still render at phone resolution on iPads and must be usable.

## Make app loading seamless

Add a [splash screen](../guides/splash-screens.md), the very first thing your users see after they select your app.

## Play nicely with the system UI

- Configure the [status bar](../guides/configuring-statusbar.md) so it doesn't clash with your interface.
- Use [native gestures](../versions/latest/sdk/gesture-handler.md) whenever possible.
- Use interface elements that make sense on the device. For example, see the [iOS Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/overview/themes/).

## Tailor your app metadata

- Add a great [icon](../guides/app-icons.md). Icon requirements between iOS and Android differ and are fairly strict, so be sure and familiarize yourself with that guide.
- Make sure your app has a valid iOS [Bundle Identifier](../versions/latest/config/app/#bundleidentifier) and [Android Package](../versions/latest/config/app/#package). Take care in choosing these, as you will not be able to change them later.

## Versioning your app

You'll use the **app.json** file to specify the version of your app, but there are a few different fields each with specific functionality.

- [`version`](../versions/latest/config/app/#version) will apply both to iOS and Android. For iOS, this corresponds to `CFBundleShortVersionString`, and for Android this corresponds to `versionName`. This is your user-facing version string for both platforms.
- [`android.versionCode`](../versions/latest/config/app/#versioncode) functions as your internal Android version number. This will be used to distinguish different binaries of your app.
- [`ios.buildNumber`](../versions/latest/config/app/#buildnumber) functions as your internal iOS version number, and corresponds to `CFBundleVersion`. This will be used to distinguish different binaries of your app.

To access these values at runtime, you can use the [Expo Application API](../versions/latest/sdk/application.md):

- Use [`Application.nativeApplicationVersion`](../versions/latest/sdk/application/#applicationnativeapplicationversion) to access the `version` value listed above.
- Use [`Application.nativeBuildVersion`](../versions/latest/sdk/application/#applicationnativebuildversion) to access either `android.versionCode` or `ios.buildNumber` values (depending on the current platform)

## Privacy Policy

- Starting October 3, 2018, all new iOS apps and app updates will be required to have a privacy policy in order to pass the App Store Review Guidelines.
- Additionally, a number of developers have reported warnings from Google if their app does not have a privacy policy, since by default all Expo apps contain code for requesting the Android Advertising ID. Though this code may not be executed depending on which Expo APIs you use, we still recommend that all apps on the Google Play Store include a privacy policy as well.

## iOS-specific guidelines

- All apps in the App Store must abide by the [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).

<ConfigClassic>

When you submit an app to the Apple App Store, Apple will ask you whether your app uses the IDFA. For builds with the Classic Build service, the answer is "yes." This is because of limitations of the Classic Build service (not present in [EAS Build](../build/introduction.md)). Classic builds contain the Facebook and Branch SDKs, which contain code for collecting the IDFA, and you'll need to check a couple boxes on the Apple submission form. See [Branch's Guide](https://blog.branch.io/how-to-submit-an-app-that-uses-an-idfa-to-the-app-store/) for which specific boxes to fill in.

> **Note**: No data is sent to Branch, Facebook, Segment, or Amplitude from your app unless you explicitly do so using the APIs. For more information on how Expo handles your data, and your end users' data, take a look at our [Privacy Explained page](https://expo.dev/privacy-explained).

</ConfigClassic>

### App privacy questions

Beginning December 8, 2020, new app submissions and updates are required to provide information about their privacy practices in App Store Connect. See [App privacy details on the App Store](https://developer.apple.com/app-store/app-privacy-details/) for more information.

Apple will ask you a series of questions when you submit the app. Depending on which libraries you use, your answers may vary. For example, if you use `expo-updates`, you will need to say **Yes, we collect data from this app** and then you will want to select **Crash Data**.

<ConfigClassic>

- Select **Yes, we collect data from this app**. Click **Next**.
- Select **Device ID**
  - Managed standalone apps using the Classic Build system include the Facebook, Facebook Ads, and Google AdMob SDKs, which still access the IDFA.
- If you use `expo-facebook`, select **Other Usage Data**
- If you use `expo-updates`, select **Crash Data**
  - Errors that occur when launching an update are collected when a new update is requested.
- If you use Facebook Ads and/or Google AdMob SDKs, select **Advertising Data**

> **Note**: Supplement the above guidance with additional disclosures based on the data your particular app and the third-party services you use collect.

</ConfigClassic>

## Android Permissions

Permissions are configured via the [`android.permissions` and `android.blockedPermissions` keys in your **app.json** file](../workflow/configuration.md#android). Most permissions are added automatically by libraries that you use in your app, and so you won't often need to use `android.permissions` to add additional permissions. You may want to use `android.blockedPermissions` to exclude permissions from being included. To do this, specify the full permission name; for example, if you want to remove the audio recording permissions added by `expo-av`:

```json
{
  "expo" : {
    ...
    "android": {
      "blockedPermissions": [
        "android.permission.RECORD_AUDIO"
      ]
    }
  }
}
```

<ConfigClassic>

By default, apps built with the Classic Build system will include **all** permissions supported by Expo. This is so that your standalone app will match its behavior in the Expo Go app and simply "work out of the box" no matter what permissions you ask for, with hardly any configuration needed on your part.

There are some drawbacks to this. For example, let's say your To-do list app requests `CAMERA` permission upon installation. Your users may be wary of installing since nothing in the app seems to use the camera, so why would it need that permission?

To remedy this, add the `android.permissions` key in your **app.json** file, and specify which permissions your app will use. A list of all Android permissions and configuration options can be found [here](../workflow/configuration.md#android).

To use _only_ the minimum necessary permissions that Expo requires to run, set `"permissions" : []`. To use those in addition to `CAMERA` permission, for example, you'd set `"permissions" : ["CAMERA"]`.

</ConfigClassic>

## Common App Rejections

- It's helpful to glance over [Common App Rejections](https://developer.apple.com/app-store/review/rejections/).
- Binaries can get rejected for having poorly formatted icons, so double check the [App Icon guide](../guides/app-icons.md).
- Apple can reject your app if elements don't render properly on an iPad, even if your app doesn't target the iPad form factor. Be sure and test your app on an iPad (or iPad simulator).

## System permissions dialogs on iOS

If your app asks for [system permissions](../versions/latest/sdk/permissions.md) from the user, e.g. to use the device's camera, or access photos, Apple requires an explanation for how your app makes use of that data. Expo will automatically provide a boilerplate reason for you, such as "Allow cool-app to access the camera", however these **must** be customized and tailored to your specific use case in order for your app to be accepted by the App Store. To do this, override these values using the [ios.infoPlist](../versions/latest/config/app/#infoplist) key in **app.json**, for example:

```json
{
  "expo" : {
    ...
    "ios" : {
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan barcodes on event tickets."
      }
    }
  }
}
```

Many of these properties are also directly configurable using the config plugin associated with the library that adds them. For example, with [expo-media-library](../versions/latest/sdk/media-library.md) you can configure photo permission messages like this:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
          "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos."
        }
      ]
    ]
  }
}
```

> Note: These properties cannot be updated over the air, they will only be published when you build a new binary, eg: with [`eas build`](../build/introduction.md).

## Localizing your iOS app

If you plan on shipping your app to different countries, regions, or just want it to support various languages, you can provide [localized](../versions/latest/sdk/localization) strings for things like the display name and system dialogs. All of this is easily set up [in your app.json](../workflow/configuration.md). First, set `ios.infoPlist.CFBundleAllowMixedLocalizations: true`, then provide a list of file paths to `locales`.

```json
{
  "expo" : {
    ...
    "ios" : {
      "infoPlist": {
        "CFBundleAllowMixedLocalizations": true
      }
    },
    "locales": {
      "ja": "./languages/japanese.json"
    }
  }
}
```

The keys provided to `locales` should be the [language identifier](https://developer.apple.com/documentation/xcode/choosing-localization-regions-and-scripts), made up of a [2-letter language code](https://www.loc.gov/standards/iso639-2/php/code_list.php) of your desired language, with an optional region code (e.g. `en-US` or `en-GB`), and the value should point to a JSON file that looks something like this:

```json
// japanese.json
{
  "CFBundleDisplayName": "こんにちは",
  "NSContactsUsageDescription": "日本語のこれらの言葉"
}
```

Now, iOS knows to set the display name of your app to `こんにちは` whenever it's installed on a device with the language set to Japanese.
