---
title: Adding a border to text in Expo and React Native apps
---

import ImageSpotlight from '~/components/plugins/ImageSpotlight';
import SnackInline from '~/components/plugins/SnackInline';

To add a border to a `Text` component in Expo and React Native apps, we will need to use a `View` component.

We will be adding a border to text, similar to the one shown below.

<ImageSpotlight style={{ maxWidth: 276 }} containerStyle={{ marginTop: 0 }} src="/static/images/textborder-example.png" alt="Text rendered with a border" />

Not what you had in mind? [Reach out to us on the forums.](https://forums.expo.io/)

## How to add a border to text

To add a border to text in React Native, wrap the `Text` component with a `View` component. The `View` component has `style` props that allow us to add a border and customize its appearance.

For a full list of `View` `style` props, please refer to the React Native docs on [View Style Props](https://reactnative.dev/docs/view-style-props).

## Example

<SnackInline>

<!-- prettier-ignore -->
```js
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
 
export default function App() {
  return (
    <View style={styles.container}>
      <View style={styles.textBorder}>
        <Text>Text with a border</Text>
      </View>
    </View>
  );
}
 
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textBorder: {
    borderWidth: 2,
  },
});
```

</SnackInline>

The example above renders a screen like this:

<ImageSpotlight style={{ maxWidth: 276 }} containerStyle={{ marginTop: 0 }} src="/static/images/textborderdevice-example.png" alt="Text rendered with a border on device" />
