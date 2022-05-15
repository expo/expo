---
title: Clipboard
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-45/packages/expo-clipboard'
packageName: 'expo-clipboard'
---

import APISection from '~/components/plugins/APISection';
import {APIInstallSection} from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

**`expo-clipboard`** provides an interface for getting and setting Clipboard content on Android, iOS, and Web.

<PlatformsSection android emulator ios simulator web />

## Installation

<APIInstallSection />

## Usage

<SnackInline label='Clipboard' dependencies={['expo-clipboard']} platforms={['ios', 'android', 'web']}>

```jsx
import * as React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';

export default function App() {
  const [copiedText, setCopiedText] = React.useState('');

  const copyToClipboard = async () => {
    /* @info Copy the text to the clipboard */
    await Clipboard.setStringAsync('hello world');
    /* @end */
  };

  const fetchCopiedText = async () => {
    const text = /* @info Paste the text from the clipboard */ await Clipboard.getStringAsync();
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
import * as Clipboard from 'expo-clipboard';
```

> ⚠️ On Web, this module uses the [`AsyncClipboard` API](https://developer.mozilla.org/en-US/docs/Web/API/Clipboard_API),
> which might behave differently between browsers or not be fully supported.
> Especially on WebKit, there's an issue which makes this API unusable in asynchronous code.
> [Click here for more details](https://bugs.webkit.org/show_bug.cgi?id=222262).

<APISection packageName="expo-clipboard" />
