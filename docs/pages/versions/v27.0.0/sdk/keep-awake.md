---
title: KeepAwake
---

A React component that prevents the screen sleeping when rendered. It also exposes static methods to control the behavior imperatively.

## Example: component

```javascript
import React from 'react';
import { Text, View } from 'react-native';
import { KeepAwake } from 'expo';

export default class KeepAwakeExample extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <KeepAwake /> // @tooltip As long as this component is mounted, the screen will not turn off from being idle.
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
    KeepAwake.activate(); // @tooltip Screen will remain on after called until <strong>KeepAwake.deactivate()</strong> is called.

  }

  _deactivate = () => {
    KeepAwake.deactivate(); // @tooltip Deactivates KeepAwake, or does nothing if it was never activated.

  }
}
```

#