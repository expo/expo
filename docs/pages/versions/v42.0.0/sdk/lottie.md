---
title: Lottie
sourceCodeUrl: 'https://github.com/react-native-community/lottie-react-native'
---

import InstallSection from '~/components/plugins/InstallSection';
import PlatformsSection from '~/components/plugins/PlatformsSection';
import SnackInline from '~/components/plugins/SnackInline';

Expo includes support for [Lottie](https://airbnb.design/lottie/), the animation library from Airbnb.

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

## API

```javascript
import LottieView from 'lottie-react-native';
```

Refer to the [lottie-react-native repository](https://github.com/airbnb/lottie-react-native#usage) for more detailed documentation.
