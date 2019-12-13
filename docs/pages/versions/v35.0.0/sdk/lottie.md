---
title: Lottie
sourceCodeUrl: "https://github.com/react-native-community/lottie-react-native"
---

import SnackInline from '~/components/plugins/SnackInline';

Expo includes support for [Lottie](https://airbnb.design/lottie/), the animation library from AirBnB.

#### Platform Compatibility

| Android Device | Android Emulator | iOS Device | iOS Simulator |  Web  |
| ------ | ---------- | ------ | ------ | ------ |
| ✅     |  ✅     | ✅     | ✅     | ❌    |

## Installation

To install this API in a [managed](../../introduction/managed-vs-bare/#managed-workflow) or [bare](../../introduction/managed-vs-bare/#bare-workflow) React Native app, run `expo install lottie-react-native`. In bare apps, also follow the [lottie-react-native linking and configuration instructions](https://github.com/react-native-community/lottie-react-native).

## Usage

<SnackInline label='Basic Lottie usage' templateId='lottie' dependencies={['lottie-react-native']}>

```javascript
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import LottieView from "lottie-react-native";

export default class App extends React.Component {
  componentDidMount() {
    this.animation.play();
    // Or set a specific startFrame and endFrame with:
    // this.animation.play(30, 120);
  }

  resetAnimation = () => {
    this.animation.reset();
    this.animation.play();
  };

  render() {
    return (
      <View style={styles.animationContainer}>
        <LottieView
          ref={animation => {
            this.animation = animation;
          }}
          style={{
            width: 400,
            height: 400,
            backgroundColor: '#eee',
          }}
          source={require('./assets/gradientBall.json')}
          // OR find more Lottie files @ https://lottiefiles.com/featured
          // Just click the one you like, place that file in the 'assets' folder to the left, and replace the above 'require' statement
        />
        <View style={styles.buttonContainer}>
          <Button title="Restart Animation" onPress={this.resetAnimation} />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  animationContainer: {
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  buttonContainer: {
    paddingTop: 20,
  },
});
```

</SnackInline>

## Importing Lottie

The Lottie SDK currently lives under Expo's **DangerZone** namespace because it's implementation is still in Alpha. You can import it like this:

```javascript
import LottieView from "lottie-react-native";
```

## Using the Lottie API

We pull in the API from [lottie-react-native](https://github.com/airbnb/lottie-react-native#basic-usage), so the documentation there is the best resource to follow.
