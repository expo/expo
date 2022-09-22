---
title: MediaLibrary
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-media-library'
---

import { ConfigClassic, ConfigReactNative, ConfigPluginExample, ConfigPluginProperties } from '~/components/plugins/ConfigSection';
import { AndroidPermissions, IOSPermissions } from '~/components/plugins/permissions';
import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-media-library`** provides access to the user's media library, allowing them to access their existing images and videos from your app, as well as save new ones. You can also subscribe to any updates made to the user's media library.

> ⚠️ If your Android app created an album using SDK &lt;= 40 and you want to add more assets to this album, you may need to migrate it to the new scoped directory. Otherwise, your app won't have access to the old album directory and expo-media-library won't be able to add new assets to it. However, all other functions will work without problems. You only need to migrate the old album if you want to add something to it. For more information, check out [Android R changes](https://expo.fyi/android-r) and [`MediaLibrary.migrateAlbumIfNeededAsync`](#medialibrarymigratealbumifneededasyncalbum).

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-media-library" />

## Configuration in app.json / app.config.js

You can configure `expo-media-library` using its built-in [config plugin](../../../guides/config-plugins.md) if you use config plugins in your project ([EAS Build](../../../build/introduction.md) or `expo run:[android|ios]`). The plugin allows you to configure various properties that cannot be set at runtime and require building a new app binary to take effect.

<ConfigClassic>

You can configure [the permissions for this library](#permissions) using [`ios.infoPlist`](../config/app.md#infoplist) and [`android.permissions`](../config/app.md#permissions).

</ConfigClassic>

<ConfigReactNative>

Learn how to configure the native projects in the [installation instructions in the `expo-media-library` repository](https://github.com/expo/expo/tree/main/packages/expo-media-library#installation-in-bare-react-native-projects).

</ConfigReactNative>

<ConfigPluginExample>

```json
{
  "expo": {
    "plugins": [
      [
        "expo-media-library",
        {
          "photosPermission": "Allow $(PRODUCT_NAME) to access your photos.",
          "savePhotosPermission": "Allow $(PRODUCT_NAME) to save photos.",
          "isAccessMediaLocationEnabled": true
        }
      ]
    ]
  }
}
```

</ConfigPluginExample>

<ConfigPluginProperties properties={[
{ name: 'photosPermission', platform: 'ios', description: 'Sets the iOS `NSPhotoLibraryUsageDescription` permission message in Info.plist.', default: '"Allow $(PRODUCT_NAME) to access your photos."' },
{ name: 'savePhotosPermission', platform: 'ios', description: 'Sets the iOS `NSPhotoLibraryAddUsageDescription` permission message in Info.plist.', default: '"Allow $(PRODUCT_NAME) to save photos."' },
{ name: 'isAccessMediaLocationEnabled', platform: 'android', description: 'Sets whether or not to request the `ACCESS_MEDIA_LOCATION` permission on Android.', default: 'false' },
]} />

## API

```js
import * as MediaLibrary from 'expo-media-library';
```

<APISection packageName="expo-media-library" apiName="MediaLibrary" />

## Permissions

### Android

The following permissions are added automatically through this library's `AndroidManifest.xml`.

<AndroidPermissions permissions={['READ_EXTERNAL_STORAGE', 'WRITE_EXTERNAL_STORAGE']} />

### iOS

The following usage description keys are used by this library:

<IOSPermissions permissions={[ 'NSPhotoLibraryUsageDescription', 'NSPhotoLibraryAddUsageDescription' ]} />
