---
id: usecolorscheme
title: useColorScheme
---

```js
import { useColorScheme } from 'react-native';
```

The `useColorScheme` React hook provides and subscribes to color scheme updates from the [`Appearance`](https://reactnative.dev/docs/0.64/appearance) module. The return value indicates the current user preferred color scheme. The value may be updated later, either through direct user action (e.g. theme selection in device settings) or on a schedule (e.g. light and dark themes that follow the day/night cycle).

### Supported color schemes

- `"light"`: The user prefers a light color theme.
- `"dark"`: The user prefers a dark color theme.
- `null`: The user has not indicated a preferred color theme.

> **Note:** Currently due to technical constraints, when the Chrome debugger is enabled, this hook will _always_ return `"light"`.

---

## Example

```js
import React from 'react';
import { Text, StyleSheet, useColorScheme, View } from 'react-native';

const App = () => {
  const colorScheme = useColorScheme();
  return (
    <View style={styles.container}>
      <Text>useColorScheme(): {colorScheme}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default App;
```

You can find a complete example that demonstrates the use of this hook alongside a React context to add support for light and dark themes to your application in [**AppearanceExample.js**](https://github.com/facebook/react-native/blob/master/packages/rn-tester/js/examples/Appearance/AppearanceExample.js).
