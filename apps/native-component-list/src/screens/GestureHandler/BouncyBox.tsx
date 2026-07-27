import React from 'react';
import { StyleSheet, View, StyleProp, ViewStyle } from 'react-native';
import { GestureDetector, usePanGesture, useRotationGesture } from 'react-native-gesture-handler';
import Animated, {
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

function Snappable({ children }: { children?: React.ReactNode }) {
  const dragX = useSharedValue(0);

  const pan = usePanGesture({
    maxPointers: 1,
    onUpdate: (event) => {
      dragX.value = event.translationX;
    },
    onDeactivate: (event) => {
      dragX.value = withSpring(0, { velocity: event.velocityX });
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: interpolate(dragX.value, [-100, -50, 0, 50, 100], [-30, -10, 0, 10, 30]) },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}

function Twistable({ children }: { children?: React.ReactNode }) {
  const rotation = useSharedValue(0);

  const rotate = useRotationGesture({
    onUpdate: (event) => {
      rotation.value = event.rotation;
    },
    onDeactivate: (event) => {
      rotation.value = withSpring(0, { velocity: event.velocity });
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {
        rotate: `${interpolate(
          rotation.value,
          [-1.2, -1, -0.5, 0, 0.5, 1, 1.2],
          [-0.52, -0.5, -0.3, 0, 0.3, 0.5, 0.52]
        )}rad`,
      },
    ],
  }));

  return (
    <GestureDetector gesture={rotate}>
      <Animated.View style={animatedStyle}>{children}</Animated.View>
    </GestureDetector>
  );
}

export default function BouncyBox({ style }: { style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Snappable>
        <Twistable>
          <View style={styles.box} />
        </Twistable>
      </Snappable>
    </View>
  );
}

const BOX_SIZE = 200;

const styles = StyleSheet.create({
  box: {
    width: BOX_SIZE,
    height: BOX_SIZE,
    borderColor: '#F5FCFF',
    alignSelf: 'center',
    backgroundColor: 'plum',
  },
});
