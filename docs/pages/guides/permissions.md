---
title: Permissions
---

import { ConfigReactNative, ConfigClassic } from '~/components/plugins/ConfigSection';

When developing a native app that requires access to potentially sensitive information on a user's device, such as their location or contacts, the app must request the user's permission first. For example, to access the user's media library, the app will need to run [`MediaLibrary.requestPermissionsAsync()`](/versions/latest/sdk/media-library#medialibraryrequestpermissionsasync).

Permissions in standalone and [development builds](/development/introduction.md) require native build-time configuration before they can be requested using runtime JavaScript code. This is not required when developing projects in the [Expo Go][expo-go] app.

> If you don't configure or explain the native permissions properly **it may result in your app getting rejected or pulled from the stores**.

## iOS

If your iOS app asks for [system permissions](/versions/latest/sdk/permissions) from the user, e.g. to use the device's camera, or access photos, Apple requires an explanation for how your app makes use of that data. Most packages will automatically provide a boilerplate reason for a given permission with [config plugins](/guides/config-plugins). These default messages will most likely need to be tailored to your specific use case in order for your app to be accepted by the App Store.

To set permission messages, use the [`expo.ios.infoPlist`](/versions/latest/config/app/#infoplist) key in your app config (**app.json**, **app.config.js**), for example:

```json
{
  "expo": {
    "ios": {
      "infoPlist": {
        "NSCameraUsageDescription": "This app uses the camera to scan barcodes on event tickets."
      }
    }
  }
}
```

Many of these properties are also directly configurable using the [config plugin](/guides/config-plugins) properties associated with the library that adds them. For example, with [`expo-media-library`](/versions/latest/sdk/media-library) you can configure photo permission messages like this:

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

- Changes to the **Info.plist** cannot be updated over-the-air, they will only be deployed when you submit a new native binary, eg: with [`eas build`](/build/introduction).
- Apple's official [permission message recommendations](https://developer.apple.com/design/human-interface-guidelines/ios/app-architecture/requesting-permission/).
- [All available **Info.plist** properties](https://developer.apple.com/library/archive/documentation/General/Reference/InfoPlistKeyReference/Articles/CocoaKeys.html#//apple_ref/doc/uid/TP40009251-SW1).

<ConfigReactNative>

Add and modify the permission message values in **Info.plist** file directly. We recommend doing this directly in Xcode for autocompletion.

</ConfigReactNative>

## Android

Permissions are configured with the [`expo.android.permissions`](/versions/latest/config/app/#permissions) and [`expo.android.blockedPermissions`](/versions/latest/config/app/#blockedpermissions) keys in your app config (**app.json**, **app.config.js**).

Most permissions are added automatically by libraries that you use in your app either with [config plugins](/guides/config-plugins) or with a package-level **AndroidManifest.xml**, so you won't often need to use `android.permissions` to add additional permissions.

The only way to remove permissions that are added by package-level **AndroidManifest.xml** files is to block them with the [`expo.android.blockedPermissions`](/versions/latest/config/app/#blockedpermissions) property. To do this, specify the **full permission name**; for example, if you want to remove the audio recording permissions added by `expo-av`:

```json
{
  "expo": {
    "android": {
      "blockedPermissions": ["android.permission.RECORD_AUDIO"]
    }
  }
}
```

- See [`expo.android.permissions`](/versions/latest/config/app.md#permissions) to learn about which permissions are included in the default [prebuild template](/workflow/prebuild#templates).
- Apps using _dangerous_ or _signature_ permissions without valid reasons **may be rejected by Google**. Ensure you follow the [Android permissions best practices](https://developer.android.com/training/permissions/usage-notes) when submitting your app.
- [All available Android Manifest.permissions](https://developer.android.com/reference/android/Manifest.permission).

<ConfigReactNative>

Modify **AndroidManifest.xml** to exclude specific permissions: add the `tools:node="remove"` attribute to a `<use-permission>` tag to ensure it is removed, even if it's included in a library **AndroidManifest.xml**.

```xml
<manifest xmlns:tools="http://schemas.android.com/tools">
  <uses-permission tools:node="remove" android:name="android.permission.ACCESS_FINE_LOCATION" />
</manifest>
```

> **Note:** you have to define the `xmlns:tools` attribute on `<manifest>` before you can use the `tools:node` attribute on permissions.

</ConfigReactNative>

<ConfigClassic>

By default, apps built with the Classic Build system will include **all** permissions required by any Expo SDK package (with exceptions only for background permissions). This is so that your standalone app will match its behavior in the [Expo Go][expo-go] app and simply "work out of the box" no matter what permissions you ask for, with minimal configuration required by the developer.

There are some drawbacks to this. For example, let's say your To-do list app requests `CAMERA` permission upon installation. Your users may be wary of installing your app since nothing in the app seems to use the camera, so why would it need that permission?

To solve this, add the `android.permissions` key in your **app.json** file and specify which permissions your app will use. Refer to this [list of all Android permissions and configuration](/workflow/configuration#android) for more information.

To use _only_ the minimum necessary permissions that React Native requires to run, set `"permissions" : []`. To use those in addition to `CAMERA` permission, for example, you'd set `"permissions" : ["CAMERA"]`.

</ConfigClassic>

## Web

On the web, permissions like the `Camera` and `Location` can only be requested from a [secure context](https://developer.mozilla.org/en-US/docs/Web/Security/Secure_Contexts#When_is_a_context_considered_secure), e.g. using `https://` or `http://localhost`. This limitation is similar to Android's manifest permissions and iOS's infoPlist usage messages and enforced to increase privacy.

## Resetting permissions

Often you want to be able to test what happens when a user rejects permissions, to ensure your app reacts gracefully. An operating-system level restriction on both iOS and Android prohibits an app from asking for the same permission more than once (you can imagine how this could be annoying for the user to be repeatedly prompted for permissions after rejecting them). To test different flows involving permissions in development, you may need to uninstall and reinstall the native app.

When testing in [Expo Go][expo-go], you can delete the app and reinstall it by running `npx expo start` and pressing <kbd>i</kbd> or <kbd>a</kbd> in the [Expo CLI](/workflow/expo-cli) Terminal UI.

[expo-go]: https://expo.dev/expo-go
