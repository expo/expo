---
title: MediaLibrary
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-43/packages/expo-media-library'
---

import APISection from '~/components/plugins/APISection';
import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-media-library`** provides access to the user's media library, allowing them to access their existing images and videos from your app, as well as save new ones. You can also subscribe to any updates made to the user's media library.

> ⚠️ If your Android app created an album using SDK <= 40 and you want to add more assets to this album, you may need to migrate it to the new scoped directory. Otherwise, your app won't have access to the old album directory and expo-media-library won't be able to add new assets to it. However, all other functions will work without problems. You only need to migrate the old album if you want to add something to it. For more information, check out [Android R changes](https://expo.fyi/android-r) and [`MediaLibrary.migrateAlbumIfNeededAsync`](#medialibrarymigratealbumifneededasyncalbum).

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="expo-media-library" />

## Configuration

In managed apps, the permission to access images or videos is added automatically.

## API

```js
import * as MediaLibrary from 'expo-media-library';
```

<APISection packageName="expo-media-library" apiName="MediaLibrary" />