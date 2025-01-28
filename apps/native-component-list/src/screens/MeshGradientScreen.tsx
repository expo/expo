import { MeshGradientView } from 'expo-mesh-gradient';
import { Platform } from 'expo-modules-core';
import { useCallback, useState } from 'react';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Button from '../components/Button';

const SCREEN_SIZE = Dimensions.get('screen');

const AnimatedMeshGradientView = Animated.createAnimatedComponent(MeshGradientView);

Animated.addWhitelistedNativeProps({
  points: true,
});

export default function MeshGradientScreen() {
  const [mask, setMask] = useState(false);
  const point = useSharedValue({ x: 0.5, y: 0.5 });

  const panGesture = Gesture.Pan()
    .minDistance(1)
    .onUpdate((event) => {
      point.value = {
        x: event.absoluteX / SCREEN_SIZE.width,
        y: event.absoluteY / SCREEN_SIZE.height,
      };
    })
    .onEnd(() => {
      point.value = withSpring(
        { x: 0.5, y: 0.5 },
        {
          restDisplacementThreshold: 0.0001,
          restSpeedThreshold: 0.02,
        }
      );
    });

  const animatedProps = useAnimatedProps(() => {
    return {
      points: [
        [0.0, 0.0],
        [0.5, 0.0],
        [1.0, 0.0],
        [0.0, 0.5],
        [point.value.x, point.value.y],
        [1.0, 0.5],
        [0.0, 1.0],
        [0.5, 1.0],
        [1.0, 1.0],
      ],
    };
  });

  const buttonStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: (point.value.x - 0.5) * SCREEN_SIZE.width },
        { translateY: (point.value.y - 0.5) * SCREEN_SIZE.height },
      ],
    };
  });

  const toggleMask = useCallback(() => {
    setMask(!mask);
  }, [mask]);

  if (Platform.OS === 'android') {
    return <Text>Mesh gradient is not available on Android</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <AnimatedMeshGradientView
        style={styles.meshGradient}
        columns={3}
        rows={3}
        colors={['red', 'purple', 'indigo', 'orange', 'white', 'blue', 'yellow', 'green', 'cyan']}
        smoothsColors
        ignoresSafeArea
        mask={mask}
        animatedProps={animatedProps}>
        <Text style={styles.maskingText}>Expo SwiftUI</Text>
      </AnimatedMeshGradientView>

      <View style={styles.container}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.button, buttonStyle]} />
        </GestureDetector>
      </View>

      <View style={styles.buttonsContainer}>
        <Button title="Toggle mask" onPress={toggleMask} buttonStyle={{ padding: 20 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  meshGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    ...StyleSheet.absoluteFillObject,
  },
  button: {
    width: 40,
    height: 40,
    backgroundColor: 'black',
    borderColor: 'white',
    borderWidth: 4,
    borderRadius: 20,
    shadowColor: 'black',
    shadowRadius: 10,
    shadowOpacity: 0.7,
    shadowOffset: { width: 0, height: 0 },
    opacity: 0.5,
  },
  buttonsContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 20,
  },
  maskingText: {
    marginTop: -200,
    padding: 12,
    color: 'black',
    fontSize: 50,
    fontWeight: 'bold',
    borderColor: '#fff6',
    borderWidth: 4,
    borderRadius: 14,
  },
});
