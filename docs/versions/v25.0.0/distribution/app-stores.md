---
title: Deploying to App Stores
---

This guide offers best practices around submitting your Expo app to the Apple iTunes Store and Google Play Store. To learn how to generate native binaries for submission, see [Building Standalone Apps](./building-standalone-apps.html).

Although you can share your published project through the Expo Client and on your [expo.io](https://expo.io) profile, submitting a standalone app to the Apple and Google stores is necessary to have a dedicated piece of real estate on your users' devices. Submitting to these stores carries stronger requirements and quality standards than sharing a toy project with a few friends, because it makes your app available through a much wider distribution platform.

**Disclaimer:** Especially in the case of Apple, review guidelines and rules change all the time, and Apple's enforcement of various rules tends to be finicky and inconsistent. We can't guarantee that your particular project will be accepted by either platform, and you are ultimately responsible for your app's behavior. However, Expo apps are native apps and behave just like any other apps, so if you've created something awesome, you should have nothing to worry about!

## Make sure your app works on many form factors

It's a good idea to test your app on a device or simulator with a small screen (e.g. an iPhone SE) as well as a large screen (e.g. an iPhone X). Ensure your components render the way you expect, no buttons are blocked, and all text fields are accessible.

Try your app on tablets in addition to handsets. Even if you have `ios.supportsTablet: false` configured, your app will still render at phone resolution on iPads and must be usable.

## Make app loading seamless

- Add a [splash screen](./splash-screens.html), the very first thing your users see after they select your app.
- Use [AppLoading](../sdk/app-loading.html) to ensure your interface is ready before the user sees it.
- [Preload and cache your assets](../guides/offline-support.html) so your app loads quickly, even with a poor internet connection.

## Play nicely with the system UI

- Configure the [status bar](./configuring-statusbar.html) so it doesn't clash with your interface.
- Use [native gestures](../sdk/gesture-handler.html) whenever possible.
- Use interface elements that make sense on the device. For example, see the [iOS Human Interface Guidelines](https://developer.apple.com/ios/human-interface-guidelines/overview/themes/).

> **Note**: iOS standalone apps [default](https://developer.apple.com/documentation/uikit/uibarstyle/uibarstyledefault) the status bar text color to white. But when developing within the Expo app, the default is black since the Expo app itself has a black status bar. Users are often surprised that their standalone apps suddenly have white status bars. In order to keep it black, you'll need to use a `<StatusBar barStyle="dark-content" />` component. See [StatusBar docs](https://facebook.github.io/react-native/docs/statusbar.html) for more information.

## Tailor your app metadata

- Add a great [icon](./app-icons.html). Icon requirements between iOS and Android differ and are fairly strict, so be sure and familiarize yourself with that guide.
- Customize your [primaryColor](../guides/configuration.html#primarycolor).
- Make sure your app has a valid iOS [Bundle Identifier](./configuration.html#bundleidentifier) and [Android Package](./configuration.html#package). Take care in choosing these, as you will not be able to change them later.
- Use [versionCode](configuration.html#versioncode) and [buildNumber](configuration.html#buildnumber) to distinguish different binaries of your app.

## iOS-specific guidelines

- All apps in the iTunes Store must abide by the [App Store Review Guidelines](https://developer.apple.com/app-store/review/guidelines/).
- It's helpful to glance over [Common App Rejections](https://developer.apple.com/app-store/review/rejections/).
- Binaries can get rejected for having poorly formatted icons, so double check the [App Icon guide](./app-icons.html).
- Apple can reject your app if elements don't render properly on an iPad, even if your app doesn't target the iPad form factor. Be sure and test your app on an iPad (or iPad simulator).
- Apple will ask you whether your app uses the IDFA. Because Expo depends on Segment Analytics, the answer is yes, and you'll need to check a couple boxes on the Apple submission form. See [Segment's Guide](https://segment.com/docs/sources/mobile/ios/quickstart/#step-5-submitting-to-the-app-store) for which specific boxes to fill in.

## System permissions dialogs on iOS

If your app asks for [system permissions](../sdk/permissions.html) from the user, e.g. to use the device's camera, access photos, or send notifications, Apple requires an explanation for how your app makes use of that data. Expo will automatically provide a boilerplate reason for you, such as "Allow cool-app to access the camera." If you would like to provide more information, you can override these values using the [ios.infoPlist](../workflow/configuration) key in `app.json`, for example:

```
"infoPlist": {
  "NSCameraUsageDescription": "This app uses the camera to scan barcodes on event tickets."
},
```

The full list of keys Expo provides by default can be seen [here](https://github.com/expo/expo/blob/master/exponent-view-template/ios/exponent-view-template/Supporting/Info.plist#L28-L41). You can provide any overrides you want in the `infoPlist` configuration. Because these strings are configured at the native level, they will only be published when you build a new binary with `exp build`.
