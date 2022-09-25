---
title: registerRootComponent
sourceCodeUrl: 'https://github.com/expo/expo/tree/sdk-44/packages/expo/src/launch'
---

import PlatformsSection from '~/components/plugins/PlatformsSection';

This function tells Expo what component to use as the root component for your app.

<PlatformsSection android emulator ios simulator web />

## Installation

This API is pre-installed in [managed](../../../introduction/managed-vs-bare.md#managed-workflow) apps. It is not available for [bare](../../../introduction/managed-vs-bare.md#bare-workflow) React Native apps.

## API

```js
import { registerRootComponent } from 'expo';
```

### `registerRootComponent(component)`

Sets the main component for Expo to use for your app.

> **Note:** Prior to SDK 18, it was necessary to use `registerRootComponent` directly, but for projects created as of SDK 18 or later, this is handled automatically in the Expo SDK.

#### Arguments

- **component (ReactComponent)** -- The React component class that renders the rest of your app.

#### Returns

No return value.

> **Note:** `registerRootComponent` is roughly equivalent to React Native's [AppRegistry.registerComponent](https://reactnative.dev/docs/appregistry.html), with some additional hooks to provide Expo specific functionality.

## Common questions

### I created my project before SDK 18 and I want to remove `registerRootComponent`, how do I do this?

- Before continuing, make sure your project is running on SDK 18 or later.
- Open up **main.js** (or if you changed it, whatever your `"main"` is in **package.json**).
- Set `"main"` to `"node_modules/expo/AppEntry.js"`.
- Delete the `registerRootComponent` call from **main.js** and put `export default` before your root component's class declaration.
- Rename **main.js** to **App.js**.

### What if I want to name my main app file something other than App.js?

You can set the `"main"` in **package.json** to any file within your
project. If you do this, then you need to use `registerRootComponent`;
`export default` will not make this component the root for the Expo app
if you are using a custom entry file.

For example, let's say you want to make `"src/main.js"` the entry file
for your app -- maybe you don't like having JavaScript files in the
project root, for example. First, set this in **package.json**:

```javascript
{
  "main": "src/main.js"
}
```

Then in `"src/main.js"`, make sure you call `registerRootComponent` and
pass in the component you want to render at the root of the app.

```javascript
import { registerRootComponent } from 'expo';
import React from 'react';
import { View } from 'react-native';

class App extends React.Component {
  render() {
    return <View />;
  }
}

registerRootComponent(App);
```
