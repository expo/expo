---
title: LinearGradient
sourceCodeUrl: "https://github.com/expo/expo/tree/sdk-35/packages/expo-linear-gradient"
---

import SnackInline from '~/components/plugins/SnackInline';

A React component that renders a gradient view.

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator |  Web  |
| ------ | ---------- | ------ | ------ | ------ |
| ✅     |  ✅     | ✅     | ✅     | ✅    |

## Installation

For [managed](../../introduction/managed-vs-bare/#managed-workflow) apps, you'll need to run `expo install expo-linear-gradient`. To use it in a [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, follow its [installation instructions](https://github.com/expo/expo/tree/master/packages/expo-linear-gradient).

## Usage

<SnackInline label='Basic LinearGradient usage' templateId='linear-gradient' dependencies={['expo-linear-gradient']}>

```javascript
import React from 'react';
import { Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default class FacebookButton extends React.Component {
  render() {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <LinearGradient
          colors={['#4c669f', '#3b5998', '#192f6a']}
          style={{ padding: 15, alignItems: 'center', borderRadius: 5 }}>
          <Text
            style={{
              backgroundColor: 'transparent',
              fontSize: 15,
              color: '#fff',
            }}>
            Sign in with Facebook
          </Text>
        </LinearGradient>
      </View>
    );
  }
}
```

</SnackInline>

## API

```js
import { LinearGradient } from 'expo-linear-gradient';
```

### props

`colors`  
An array of colors that represent stops in the gradient. At least two colors are required (otherwise it's not a gradient, it's just a fill!).

`start`  
An array of `[x, y]` where x and y are floats. They represent the position that the gradient starts at, as a fraction of the overall size of the gradient. For example, `[0.1, 0.2]` means that the gradient will start 10% from the left and 20% from the top.

`end`  
Same as start but for the end of the gradient.

`locations`  
An array of the same length as `colors`, where each element is a float with the same meaning as the `start` and `end` values, but instead they indicate where the color at that index should be.
