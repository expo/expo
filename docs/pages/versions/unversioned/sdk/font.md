---
title: Font
sourceCodeUrl: 'https://github.com/expo/expo/tree/main/packages/expo-font'
packageName: 'expo-font'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackEmbed from '~/components/plugins/SnackEmbed';

`expo-font` allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Fonts](/guides/using-custom-fonts) guide.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Usage

### Example: hook

<SnackEmbed snackId="@amanhimself/expo-font-docs-hook-example" preview platform="web" />

## API

```js
import * as Font from 'expo-font';
```

<APISection packageName="expo-font" />

## Error Codes

| Code                | Description                                                       |
| ------------------- | ----------------------------------------------------------------- |
| ERR_FONT_API        | If the arguments passed to `loadAsync` are invalid.               |
| ERR_FONT_SOURCE     | The provided resource was of an incorrect type.                   |
| ERR_WEB_ENVIRONMENT | The browser's `document` element doesn't support injecting fonts. |
| ERR_DOWNLOAD        | Failed to download the provided resource.                         |
| ERR_FONT_FAMILY     | Invalid font family name was provided.                            |
| ERR_UNLOAD          | Attempting to unload fonts that haven't finished loading yet.     |
