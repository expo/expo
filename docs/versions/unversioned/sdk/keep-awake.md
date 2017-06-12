---
title: KeepAwake
---

A React component that prevents the screen sleeping when rendered. It also exposes static methods to control the behavior imperatively.

## Example: component

```javascript
import React from 'react';
import {
  Text,
  StyleSheet,
  View,
} from 'react-native';
import { KeepAwake } from 'expo';

export default class KeepAwakeExample extends React.Component {
  render() {
    return (
      <View>
        <KeepAwake />
        <Text>This screen will never sleep!</Text>
      </View>
    );
  }
}
```

### Example: static methods

```javascript
import React from 'react';
import {
  Button,
  StyleSheet,
  View,
} from 'react-native';
import { KeepAwake } from 'expo';

export default class KeepAwakeExample extends React.Component {

  _activate = () => {
    KeepAwake.activate();
  }

  _deactivate = () => {
    KeepAwake.deactivate();
  }

  render() {
    return (
      <View>
        <Button onPress={this._activate}>Activate</Button>
        <Button onPress={this._deactivate}>Deactivate</Button>
      </View>
    );
  }
}
```
