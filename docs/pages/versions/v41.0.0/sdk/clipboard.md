---
title: Clipboard
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-41/packages/expo-clipboard'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-clipboard`** provides an interface for getting and setting Clipboard content on Android, iOS, and Web.

<PlatformsSection android emulator ios simulator web />

## Installation

<InstallSection packageName="expo-clipboard" />

## Usage

<SnackInline label='Clipboard' dependencies={['expo-clipboard']} platforms={['ios', 'android']}>

```jsx
import * as React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import Clipboard from 'expo-clipboard';

export default function App() {
  const [copiedText, setCopiedText] = React.useState('');

  const copyToClipboard = () => {
    /* @info */ Clipboard.setString('hello world');
  /* @end */
  };

  const fetchCopiedText = async () => {
    const text = /* @info */ await Clipboard.getStringAsync();
    /* @end */
    setCopiedText(text);
  };

  return (
    <View style={styles.container}>
      <Button title="Click here to copy to Clipboard" onPress={copyToClipboard} />
      <Button title="View copied text" onPress={fetchCopiedText} />
      <Text style={styles.copiedText}>{copiedText}</Text>
    </View>
  );
}

/* @hide const styles = StyleSheet.create({ ... }); */
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiedText: {
    marginTop: 10,
    color: 'red',
  },
});
/* @end */
```

</SnackInline>

## API

```js
import Clipboard from 'expo-clipboard';
```

## Methods

### `Clipboard.getStringAsync()`

Gets the content of the user's clipboard.

> Please note that calling this method on **web** will prompt the user to grant your app permission to "see text and images copied to the clipboard."

#### Returns

A promise that resolves to the content of the clipboard.

### `Clipboard.setString(value: string)`

Sets the content of the user's clipboard.

#### Arguments

- **value (_string_)** -- The string to save to the clipboard.

#### Returns

On web, this returns a boolean value indicating whether or not the string was saved to the user's clipboard. On iOS and Android, nothing is returned.
