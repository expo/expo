---
title: Advanced ExpoKit Topics
---

> ExpoKit is deprecated and will no longer be supported after SDK 38. If you need to make customizations to your Expo project, we recommend using the [bare workflow](../workflow/customizing.md) instead.

This guide goes deeper into a few [ExpoKit](expokit.md) topics that aren't critical
right out of the box, but that you may encounter down the road. If you're not familiar with
ExpoKit, you might want to read [the ExpoKit guide](expokit.md) first.

## Un-ejecting

It is possible to manually "un-eject" your project, for example if you want to return to a JS-only state, or if you want to repeatedly eject for testing purposes. Since your project won't be ejected any more, you will no longer be able to use custom native code.

> **Warning:** The following instructions will permanently remove the native iOS and Android code from your project, including any changes you've made. We strongly recommend committing your changes to version control before trying this.

To un-eject:

- Delete the `ios` and `android` directories from your project.
- Delete the `isDetached` and `detach` keys from your project's **app.json**.

You can now use your project like a normal Expo project (with no ExpoKit).

## Verifying Bundles (iOS only)

When we serve updates to your ExpoKit project, we include a signature so that
your project can verify that the JS actually came from our servers.

By default, projects that use ExpoKit have this feature disabled on iOS and enabled on
Android. We encourage you to enable it on iOS so that your code is verified for all of your
users.

To enable code verification in your native project with ExpoKit:

- Fulfill one of these two requirements (you only need one):

  - Use a non-wildcard bundle identifier when provisioning the app (recommended)
  - Enable **Keychain Sharing** in your Xcode project settings under **Capabilities**. (faster to
    set up)

- In `ios/your-project/Supporting/EXShell.plist`, set `isManifestVerificationBypassed` to
  `NO` (or delete this key entirely).

## Configuring the JS URL

In development, your ExpoKit project will request your local build from Expo CLI. You can see this configuration in **EXBuildConstants.plist** (iOS) or `ExponentBuildConstants` (Android). You shouldn't need to edit it, because it's written automatically when you serve the project.

In production, your ExpoKit project will request your published JS bundle. This is configured in **EXShell.plist** (iOS) and **MainActivity.java** (Android). If you want to specify custom behavior in iOS, you can also set the `[ExpoKit sharedInstance].publishedManifestUrlOverride` property.

## Changing the Deep Link Scheme

If you do not have a `scheme` specified in app.json at the time of ejecting, Expo will automatically generate a random one for you. If you'd like to switch to a different scheme after ejecting, there are a few places where you need to find an occurrence of your old scheme and replace it with the new one:

1.  **app.json** (the `"scheme"` field)
2.  `ios/<your-project-name>/Supporting/Info.plist` (under the first occurrence of`CFBundleURLSchemes`)
3.  **android/app/src/main/AndroidManifest.xml** (in a line that looks like `<data android:scheme="<your-scheme-here>"/>`, under `MainActivity`, or `LauncherActivity` for older projects)
4.  `android/app/src/main/java/host/exp/exponent/generated/AppConstants.java` (the `SHELL_APP_SCHEME` variable)

## Enabling Optional Expo Modules on iOS

To enable FaceDetector, ARKit, or Payments in your iOS app, see [Universal Modules and ExpoKit](universal-modules-and-expokit.md).

## Using DocumentPicker

In iOS Expokit projects, the DocumentPicker module requires the iCloud entitlement to work properly. If your app doesn't have it already, you can add it by opening the project in Xcode and following these steps:

- In the project go to the `Capabilities` tab.
- Set the iCloud switch to on.
- Check the `iCloud Documents` checkbox.

If everything worked properly your screen should look like this:

![](/static/images/icloud-entitlement.png)

## Using Google Maps

If you integrate Google Maps to your ExpoKit app with the MapView component, you may need to follow additional instructions to provide your Google Maps API key. See the [MapView docs](../versions/latest/sdk/map-view.md).
