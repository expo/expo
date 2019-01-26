---
title: Advanced ExpoKit Topics
---

import withDocumentationElements from '~/components/page-higher-order/withDocumentationElements';

export default withDocumentationElements(meta);

This guide goes deeper into a few [ExpoKit](../expokit/) topics that aren't critical
right out of the box, but that you may encounter down the road. If you're not familiar with
ExpoKit, you might want to read [the ExpoKit guide](../expokit/) first.

## Un-detaching

It is possible to manually "un-detach" your project, for example if you want to return to a JS-only state, or if you want to repeatedly detach for testing purposes. Since your project won't be detached any more, you will no longer be able to use custom native code.

> **Warning:** The following instructions will permanently remove the native iOS and Android code from your project, including any changes you've made. We strongly recommend committing your changes to version control before trying this.

To un-detach:

- Delete the `ios` and `android` directories from your project.
- Delete the `isDetached` and `detach` keys from your project's `app.json`.

You can now use your project like a normal Expo project (with no ExpoKit).

## Verifying Bundles (iOS only)

When we serve your JS over-the-air to your ExpoKit project, we include a signature so that
your project can verify that the JS actually came from our servers.

By default, projects that use ExpoKit have this feature disabled on iOS and enabled on
Android. We encourage you to enable it on iOS so that your code is verified for all of your
users.

To enable code verification in your native project with ExpoKit:

-   Fulfill one of these two requirements (you only need one):

    -   Use a non-wildcard bundle identifier when provisioning the app (recommended)
    -   Enable **Keychain Sharing** in your Xcode project settings under **Capabilities**. (faster to
        set up)

-   In `ios/your-project/Supporting/EXShell.plist`, set `isManifestVerificationBypassed` to
    `NO` (or delete this key entirely).

## Disabling Expo Analytics

By default, apps using ExpoKit will track some Expo-specific usage statistics. This is covered
in our [privacy policy](https://expo.io/privacy). You can disable Expo analytics in your app by
following these steps:

On iOS, add the key `EXAnalyticsDisabled` to your app's main `Info.plist` with the value `YES`.

## Configuring the JS URL

In development, your ExpoKit project will request your local build from XDE/exp. You can see this configuration in `EXBuildConstants.plist` (iOS) or `ExponentBuildConstants` (Android). You shouldn't need to edit it, because it's written automatically when you serve the project.

In production, your ExpoKit project will request your published JS bundle. This is configured in `EXShell.plist` (iOS) and `MainActivity.java` (Android). If you want to specify custom behavior in iOS, you can also set the `[ExpoKit sharedInstance].publishedManifestUrlOverride` property.

## Enabling Optional Expo Modules on iOS

A few Expo modules are not included in Standalone iOS Apps produced by `exp build`. Typically this is either because they add a disproportionate amount of bloat to the binary, or because they include APIs that are governed by extra Apple review guidelines. Right now those modules are:

- FaceDetector
- ARKit
- Payments

If you want to use any of these modules in your Expo iOS app, you need to detach to ExpoKit rather than using `exp build`. (It's on our roadmap to improve this.) Within your ExpoKit project, you'll need to include the appropriate [subspec](https://github.com/expo/expo/blob/master/ExpoKit.podspec) in your `Podfile`. By default, none are included.

## Using DocumentPicker

In iOS Expokit projects, the DocumentPicker module requires the iCloud entitlement to work properly. If your app doesn't have it already, you can add it by opening the project in Xcode and following these steps:

- In the project go to the `Capabilities` tab.
- Set the iCloud switch to on.
- Check the `iCloud Documents` checkbox.

If everything worked properly your screen should look like this:

![](/static/images/icloud-entitlement.png)
