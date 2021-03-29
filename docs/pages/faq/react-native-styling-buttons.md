---
title: 'Styling a React Native Button'
---

React Native exports a [`<Button />`](https://reactnative.dev/docs/button) component that exposes the native button element for Android, iOS, and the web. The `<Button />` component accepts `title` and `onPress` props, however it does not accept a `style` prop, which makes it hard to customize the style. The closest we can get to styling a `<Button />` exported from React Native is with the `color` prop. Below is an example of two buttons on Android, iOS, and the web. The first button is the default `<Button />` and the second is another default `<Button />` with its `color` prop set to `"red".

![default-button](https://user-images.githubusercontent.com/6455018/112760134-f82c9c80-8fc3-11eb-86fd-59a4d9abf68b.png)

To create a button with a custom style, we can to turn to the [`<Pressable />`](https://reactnative.dev/docs/pressable) component.`<Pressable />`let's us fully customize the appearance of a pressable element (like a button), in addition to allowing us to customize it's behavior. Here's an example of using`<Pressable />` to create a button component:

```jsx
import React from 'react';
import { Text, View, StyleSheet, Pressable } from 'react-native';
export default function Button(props) {
  const { onPress, title = 'Save' } = props;
  return (
    <Pressable style={styles.button} onPress={onPress}>
      <Text style={styles.text}>{title}</Text>
    </Pressable>
  );
}
const styles = StyleSheet.create({
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 4,
    elevation: 3,
    backgroundColor: 'black',
  },
  text: {
    fontSize: 16,
    lineHeight: 21,
    fontWeight: 'bold',
    letterSpacing: 0.25,
    color: 'white',
  },
});
```

And here's the result of this code:

<img width="973" alt="Screen Shot 2021-03-28 at 1 02 59 PM" src="https://user-images.githubusercontent.com/6455018/112760791-34f99300-8fc6-11eb-9acf-459641cb02e2.png" />

React Native's `<Button />` component does not accept a `style` prop, and it's `color` prop is limited and appears differently across Android, iOS, and the web. With the `<Pressable />` component, we can create custom buttons that fit our app's design. Those styles will also be the same across Android, iOS, and the web, which will give our apps a consistent look on every platform.
