---
title: Reanimated
---

This API simplifies the process of creating smooth, powerful, and maintainable animations. From the project's README:

> It provides a more comprehensive, low level abstraction for the Animated library API to be built on top of and hence allow for much greater flexibility especially when it comes to gesture based interactions.

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install react-native-reanimated`. In bare apps, you should also follow the [react-native-reanimated linking and configuration instructions](https://github.com/kmagiera/react-native-reanimated#getting-started).

## API Usage

You should refer to the [react-native-reanimated docs](https://github.com/kmagiera/react-native-reanimated#reanimated-overview) for more information on the API and its usage. But the following example (courtesy of that repo) is a quick way to get started.

```js
import React from 'react';
import { StyleSheet, Text, View, Button } from 'react-native';

import Animated, { Easing } from 'react-native-reanimated';

const { Value, timing } = Animated;

export default class Example extends React.Component {
  constructor(props) {
    super(props);
    this._transX = new Value(0);
    this._config = {
      duration: 5000,
      toValue: 180,
      easing: Easing.inOut(Easing.ease),
    };
    this._anim = timing(this._transX, this._config);
  }

  render() {
    return (
      <View style={styles.container}>
        <Animated.View style={[styles.box, { transform: [{ translateX: this._transX }] }]} />
        <Button
          onPress={() => {
            this._anim.start();
          }}
          title="Start"
        />
      </View>
    );
  }
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#ecf0f1',
    padding: 8,
  },
  box: {
    width: 50,
    height: 50,
    backgroundColor: 'purple',
    borderRadius: 5,
  },
});
```
