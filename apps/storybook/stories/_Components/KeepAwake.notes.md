# KeepAwake

---

A React component that prevents the screen sleeping when rendered. It also exposes static methods to control the behavior imperatively.

## Installation

This API is pre-installed in [managed](../../introduction/managed-vs-bare/#managed-workflow) apps. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-keep-awake).

## Usage

```js
// in managed apps:
import { KeepAwake } from 'expo';

// in bare apps:
import KeepAwake from 'expo-keep-awake';
```

### Example: component

```javascript
import React from 'react';
import { Text, View } from 'react-native';
import { KeepAwake } from 'expo';

export default class KeepAwakeExample extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        /* @info As long as this component is mounted, the screen will not turn off from being idle.
        */ <KeepAwake />
        /* @end */
        <Text>This screen will never sleep!</Text>
      </View>
    );
  }
}
```

### Example: static methods

```javascript
import React from 'react';
import { Button, View } from 'react-native';
import { KeepAwake } from 'expo';

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
    /* @info Screen will remain on after called until <strong>KeepAwake.deactivate()</strong> is called. */ KeepAwake.activate(); /* @end */
  };

  _deactivate = () => {
    /* @info Deactivates KeepAwake, or does nothing if it was never activated. */ KeepAwake.deactivate(); /* @end */
  };
}
```

### `KeepAwake.activate(tag?: string)`

Prevents screen from sleeping, until `deactivate` is called.
If `tag` argument is used, sleep will be prevented until `deactivate` call with the same `tag` argument. When using multiple `tags` for activation you'll have to deactivate every one in order to reenable screen sleep.

#### Arguments

- **tag (_string_)** -- **optional** -- Tag to lock screen sleep prevention. If not provided, default one is used.

### `KeepAwake.deactivate(tag?: string)`

Releases lock of screen sleep prevention on specified `tag`.

#### Arguments

- **tag (_string_)** -- **optional** -- Tag to release the lock on screen sleep prevention. If not provided, default one is used.
