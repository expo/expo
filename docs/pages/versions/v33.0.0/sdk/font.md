---
title: Font
---

Allows loading fonts from the web and using them in React Native components. See more detailed usage information in the [Using Custom Fonts](../../guides/using-custom-fonts/#using-custom-fonts) guide.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-font`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-font).

## API

```js
import * as Font from 'expo-font';
```

### `Font.loadAsync(object)`

Convenience form of [`Font.loadAsync()`](#expofontloadasync 'Font.loadAsync') that loads multiple fonts at once.

#### Arguments

- **map (_object_)** -- A map of names to `require` statements as in [`Font.loadAsync()`](#expofontloadasync 'Font.loadAsync').

#### Example

```javascript
Font.loadAsync({
  Montserrat: require('./assets/fonts/Montserrat.ttf'),
  'Montserrat-SemiBold': require('./assets/fonts/Montserrat-SemiBold.ttf'),
});
```

#### Returns

Returns a promise. The promise will be resolved when the fonts have finished loading.
