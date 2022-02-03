import React from 'react';
import { View, Button, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  Easing,
  useAnimatedStyle,
  withRepeat,
  withSequence,
} from 'react-native-reanimated';

const ANGLE = 9;
const TIME = 100;
const EASING = Easing.elastic(1.5);

function WobbleExample(): React.ReactElement {
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
          rotation.value = withSequence(
            // deviate left to start from -ANGLE
            withTiming(-ANGLE, { duration: TIME / 2, easing: EASING }),
            // wobble between -ANGLE and ANGLE 7 times
            withRepeat(
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
    borderRadius: 15,
    backgroundColor: '#001a72',
  },
});

export default WobbleExample;
