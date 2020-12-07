---
title: Clipboard
sourceCodeUrl: 'https://github.com/expo/expo/tree/master/packages/expo-clipboard'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';

**`expo-clipboard`** provides an interface for getting and setting Clipboard content on Android, iOS, and Web.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-clipboard" />

## API

```js
import Clipboard from 'expo-clipboard';
```

## Methods

- [`Clipboard.getStringAsync()`](#clipboardgetstringasync)
- [`Clipboard.setString(value: string)`](#clipboardsetstringvalue-string)

### `Clipboard.getStringAsync()`

Gets the content of the user's clipboard. Please note that calling this method on web will prompt the user to grant your app permission to "see text and images copied to the clipboard."

#### Returns

A promise that resolves to the content of the clipboard.

### `Clipboard.setString(value: string)`

Sets the content of the user's clipboard.

#### Arguments

- **value (_string_)** -- The string to save to the clipboard.

#### Returns

On web, this retuns a boolean value indicating whether or not the string was saved to the user's clipboard. On iOS and Android, nothing is returned.
