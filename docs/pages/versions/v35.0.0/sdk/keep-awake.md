---
title: KeepAwake
---

A React hook that prevents the screen from sleeping and a pair of functions to enable this behavior imperatively.

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-keep-awake`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-keep-awake).

> **Note**: Not compatible with web.

## Usage

```js
import KeepAwake from 'expo-keep-awake';
```

### Example: hook

```javascript
import { useKeepAwake } from 'expo-keep-awake';
import React from 'react';
import { Text, View } from 'react-native';

export default function KeepAwakeExample {
  /* @info As long as this component is mounted, the screen will not turn off from being idle. */
  useKeepAwake();
  /* @end */
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>This screen will never sleep!</Text>
    </View>
  );
}
```

### Example: functions

```javascript
import { activateKeepAwake, deactivateKeepAwake } from 'expo-keep-awake';
import React from 'react';
import { Button, View } from 'react-native';

export default class KeepAwakeExample extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Button onPress={this._activate}>Activate</Button>
        <Button onPress={this._deactivate}>Deactivate</Button>
      </View>
    );
  }

  _activate = () => {
    /* @info Screen will remain on after called until <strong>deactivateKeepAwake()</strong> is called. */ 
    activateKeepAwake();
  /* @end */
  };

  _deactivate = () => {
    /* @info Deactivates KeepAwake, or does nothing if it was never activated. */
    deactivateKeepAwake();
  /* @end */
  };
}
```

### `useKeepAwake(tag?: string): void`

A React hook to keep the screen awake for as long as the owner component is mounted. The optionally provided `tag` argument is used when activating and deactivating the keep-awake feature. If unspecified, the default tag is used. See the documentation for `activateKeepAwake` below to learn more about the `tag` argument.

### `activateKeepAwake(tag?: string): void`

Prevents the screen from sleeping until `deactivateKeepAwake` is called with the same `tag` value.

If the `tag` argument is specified, the screen will not sleep until you call `deactivateKeepAwake` with the same `tag` argument. When using multiple `tags` for activation you'll have to deactivate each one in order to re-enable screen sleep. If `tag` is unspecified, the default tag is used.

#### Arguments

- **tag (_string_)** -- **optional** -- Tag to lock screen sleep prevention. If not provided, the default tag is used.

### `deactivateKeepAwake(tag?: string): void`

Releases the lock on screen-sleep prevention associated with the given `tag` value. If `tag` is unspecified, it defaults to the same default tag that `activateKeepAwake` uses.

#### Arguments

- **tag (_string_)** -- **optional** -- Tag to release the lock on screen sleep prevention. If not provided, the default tag is used.
