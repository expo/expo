---
id: clipboard
title: Clipboard
---

> This API is deprecated and will be removed from react-native in the next release. Use [expo-clipboard](../sdk/clipboard.md) instead.

`Clipboard` gives you an interface for setting and getting content from Clipboard on both Android and iOS

---

## Example

```js

import React, { useState } from 'react'
import { SafeAreaView, View, Text, TouchableOpacity, Clipboard, StyleSheet } from 'react-native'

const App = () => {
  const [copiedText, setCopiedText] = useState('')

  const copyToClipboard = () => {
    Clipboard.setString('hello world')
  }

  const fetchCopiedText = async () => {
    const text = await Clipboard.getString()
    setCopiedText(text)
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity onPress={() => copyToClipboard()}>
          <Text>Click here to copy to Clipboard</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => fetchCopiedText()}>
          <Text>View copied text</Text>
        </TouchableOpacity>

        <Text style={styles.copiedText}>{copiedText}</Text>
      </View>

    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  copiedText: {
    marginTop: 10,
    color: 'red'
  }
})

export default App
```

# Reference

## Methods

### `getString()`

```jsx
static getString()
```

Get content of string type, this method returns a `Promise`, so you can use following code to get clipboard content

```jsx
async _getContent() {
  var content = await Clipboard.getString();
}
```

---

### `setString()`

```jsx
static setString(content)
```

Set content of string type. You can use following code to set clipboard content

```jsx
_setContent() {
  Clipboard.setString('hello world');
}
```

**Parameters:**

| Name    | Type   | Required | Description                               |
| ------- | ------ | -------- | ----------------------------------------- |
| content | string | Yes      | The content to be stored in the clipboard |

_Notice_

Be careful when you're trying to copy to clipboard any data except `string` and `number`, some data need additional stringification. For example, if you will try to copy array - Android will raise an exception, but iOS will not.
