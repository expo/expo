import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  // @ts-ignore
  Easing,
  useAnimatedStyle,
  repeat,
  sequence,
} from 'react-native-reanimated';

const ANGLE = 9;
const TIME = 100;
const EASING = Easing.elastic(1.5);

export default function WobbleExample() {
  const rotation = useSharedValue(1);

  const style = useAnimatedStyle(() => {
    return {
      transform: [{ rotateZ: `${rotation.value}deg` }],
    };
  });

  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'column',
      }}>
      <Animated.View style={[styles.box, style]} />
      <Button
        title="start"
        onPress={() => {
          rotation.value = sequence(
            // deviate left to start from -ANGLE
            withTiming(-ANGLE, { duration: TIME / 2, easing: EASING }),
            // wobble between -ANGLE and ANGLE 7 times
            repeat(
              withTiming(ANGLE, {
                duration: TIME,
                easing: EASING,
              }),
              7,
              true
            ),
            // go back to 0 at the end
            withTiming(0, { duration: TIME / 2, easing: EASING })
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 80,
    height: 80,
    alignSelf: 'center',
    margin: 50,
    borderRadius: 15,
    backgroundColor: '#001a72',
  },
});
