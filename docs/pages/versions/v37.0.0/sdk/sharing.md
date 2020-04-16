---
title: Sharing
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-36/packages/expo-sharing'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import Video from '../../../../components/plugins/Video'

**`expo-sharing`** allows you to share files directly with other compatible applications.

<Video file={"sdk/sharing.mp4"} loop={false} />

<PlatformsSection android emulator ios simulator web />

<br />

> 🚨 **Web browser support**: expo-sharing for web is built on top of the Web Share API, which still has [very limited browser support](https://caniuse.com/#feat=web-share). Be sure to check that the API can be used before calling it by using `Sharing.isAvailableAsync()`.

<br/>

> 💡 **HTTPS required on web**: The Web Share API is only available on web when the page is served over https. Run your app with `expo start --https` to enable it.

<br/>

> ⚠️ **No local file sharing on web**: Sharing local files by URI works on iOS and Android, but not on web. You cannot share local files on web by URI &mdash; you will need to upload them somewhere and share that URI.

## Installation

<InstallSection packageName="expo-sharing" />

## API

```js
import * as Sharing from 'expo-sharing';
```

**[Methods](#methods)**

- [`Sharing.isAvailableAsync()`](#sharingisavailableasync)
- [`Sharing.shareAsync(url, options)`](#sharingshareasyncurl-options)

## Methods

### `Sharing.isAvailableAsync()`

Determine if the sharing API can be used in this app.

#### Returns

A promise that resolves to `true` if the sharing API can be used, and `false` otherwise.

### `Sharing.shareAsync(url, options)`

Opens action sheet to share file to different applications which can handle this type of file.

#### Arguments

- **url (_string_)** -- Local file URL to share.
- **options (_object_)** --

  A map of options:

  - **mimeType (_string_)** -- sets `mimeType` for `Intent` (**Android only**)
  - **dialogTitle (_string_)** -- sets share dialog title (**Android and Web only**)
  - **UTI (_string_)** -- ([Uniform Type Identifier](https://developer.apple.com/library/archive/documentation/FileManagement/Conceptual/understanding_utis/understand_utis_conc/understand_utis_conc.html)) the type of the target file (**iOS only**)
