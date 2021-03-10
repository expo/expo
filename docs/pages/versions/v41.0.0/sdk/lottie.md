---
title: Lottie
sourceCodeUrl: 'https://github.com/react-native-community/lottie-react-native'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

Expo includes support for [Lottie](https://airbnb.design/lottie/), the animation library from AirBnB.

<PlatformsSection android emulator ios simulator />

## Installation

<InstallSection packageName="lottie-react-native" href="https://github.com/react-native-community/lottie-react-native" />

## Usage

<SnackInline
label="Lottie"
dependencies={['lottie-react-native']}
files={{
    'assets/gradientBall.json': 'assets/gradientBall.json'
  }}>

```js
import React from 'react';
import { Button, StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';

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

You can import it like this:

```javascript
import LottieView from 'lottie-react-native';
```

## Known Issues

> The Lottie SDK is currently considered to be under Expo's "DangerZone" because it's implementation is still in Alpha.

- Importing Lottie 3 files causes the previewer to crash without a visible error, because Expo relies on `lottie-react-native` v2.

## Using the Lottie API

We pull in the API from [lottie-react-native](https://github.com/airbnb/lottie-react-native#basic-usage), so the documentation there is the best resource to follow.
