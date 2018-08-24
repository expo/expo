/**
 * @flow
 */

import React from 'react';
import { Animated, Easing, Image, MaskedViewIOS, View } from 'react-native';

const AnimatedMaskView = Animated.createAnimatedComponent(MaskedViewIOS);

export default class BasicMaskScreen extends React.Component {
  static navigationOptions = {
    title: 'Basic Mask Example',
  };

  state = {
    text: '100',
  };

  componentWillMount() {
    this._animatedTextValue = new Animated.Value(0);
    Animated.loop(
      Animated.timing(this._animatedTextValue, {
        toValue: 360,
        duration: 2000,
        easing: Easing.linear,
      })
    ).start();

    this._animatedScaleValue = new Animated.Value(1);
    Animated.loop(
      Animated.sequence([
        Animated.timing(this._animatedScaleValue, {
          duration: 1000,
          toValue: 1.5,
          useNativeDriver: true,
        }),
        Animated.timing(this._animatedScaleValue, {
          duration: 1000,
          toValue: 1,
          useNativeDriver: true,
        }),
      ])
    ).start();

    let counter = 100;
    this._interval = setInterval(() => {
      counter++;
      this.setState({
        text: `${counter}`,
      });
    }, 1000);
  }

  componentWillUnmount() {
    if (this._interval) {
      clearInterval(this._interval);
    }
  }

  render() {
    const width = 240;
    const height = 200;
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <AnimatedMaskView
          style={{
            width,
            height,
            transform: [{ scale: this._animatedScaleValue }],
          }}
          maskElement={
            <View
              style={{
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'transparent',
              }}>
              <Image
                style={{ width }}
                resizeMode="contain"
                source={require('../assets/images/exponent-wordmark.png')}
              />
              <Animated.Text
                key={this.state.text}
                style={{
                  backgroundColor: 'transparent',
                  fontWeight: 'bold',
                  fontSize: 40,
                  transform: [
                    {
                      rotate: this._animatedTextValue.interpolate({
                        inputRange: [0, 360],
                        outputRange: ['0deg', '360deg'],
                      }),
                    },
                  ],
                }}>
                {this.state.text}
              </Animated.Text>
            </View>
          }>
          <Image style={{ width, height }} source={require('../assets/images/example3.jpg')} />
        </AnimatedMaskView>
      </View>
    );
  }
}
