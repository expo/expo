import MaskedView from '@react-native-masked-view/masked-view';
import React, { useEffect } from 'react';
import { Animated, Easing, Image, View } from 'react-native';

const AnimatedMaskView = Animated.createAnimatedComponent(MaskedView);

MaskedViewScreen.navigationOptions = {
  title: 'Basic Mask Example',
};
export default function MaskedViewScreen() {
  const [text, setText] = React.useState(100);

  const animatedTextValue = React.useRef(new Animated.Value(0));
  const animatedScaleValue = React.useRef(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(animatedTextValue.current, {
        useNativeDriver: false,
        toValue: 360,
        duration: 100,
        easing: Easing.linear,
      })
    ).start();

    animatedScaleValue.current = new Animated.Value(1);

    Animated.loop(
      Animated.sequence([
        Animated.timing(animatedScaleValue.current, {
          duration: 1000,
          toValue: 1.5,
          useNativeDriver: true,
        }),
        Animated.timing(animatedScaleValue.current, {
          duration: 1000,
          toValue: 1,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setText((text) => text + 1);
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // NOTE(brentvatne): this doesn't work properly on Android yet

  const width = 240;
  const height = 200;
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <AnimatedMaskView
        style={{
          width,
          height,
          transform: [{ scale: animatedScaleValue.current }],
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
              source={require('../../assets/images/logo-wordmark.png')}
            />
            <Animated.Text
              key={text}
              style={{
                backgroundColor: 'transparent',
                fontWeight: 'bold',
                fontSize: 40,
                transform: [
                  {
                    rotate: animatedTextValue.current.interpolate({
                      inputRange: [0, 360],
                      outputRange: ['0deg', '360deg'],
                    }),
                  },
                ],
              }}>
              {text}
            </Animated.Text>
          </View>
        }>
        <Image style={{ width, height }} source={require('../../assets/images/example1.jpg')} />
      </AnimatedMaskView>
    </View>
  );
}
