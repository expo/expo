import { BlurTint, BlurView, BlurViewProps } from 'expo-blur';
import React, { useCallback, useRef, memo, useEffect } from 'react';
import { View, StyleSheet, Text, Image } from 'react-native';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import useResettingState from '../../utilities/useResettingState';
import Slider from './Slider';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default memo((props: { tint: BlurTint }) => {
  const blurViewRef = useRef<View>(null);
  const animatedIntensity = useSharedValue(0);
  const manualIntensity = useSharedValue(0);
  const [manualIntensityIsActive, setManualIntensityIsActive] = useResettingState(false, 3000);

  const handleSliderChange = useCallback((value: number) => {
    setManualIntensityIsActive(true);
    manualIntensity.value = value;
  }, []);

  useEffect(() => {
    // Use two with timing animations to make sure the animation always runs from 0 to 100
    animatedIntensity.value = withRepeat(
      withSequence(withTiming(100, { duration: 2000 }), withTiming(0, { duration: 2000 })),
      -1,
      true
    );
  }, []);

  const animatedProps = useAnimatedProps(() => {
    return {
      proxiedProperties: {
        intensity: manualIntensityIsActive ? manualIntensity.value : animatedIntensity.value,
        tint: props.tint,
      },
    } as BlurViewProps;
  });

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Image style={styles.image} source={{ uri: 'https://source.unsplash.com/300x300' }} />
        <Text style={styles.blurredText}>This text is blurred</Text>
        <AnimatedBlurView ref={blurViewRef} style={styles.blurView} animatedProps={animatedProps}>
          <Text style={styles.nonBlurredText}>{props.tint}</Text>
          <Slider
            title="Manual intensity:"
            onChange={handleSliderChange}
            active={!!manualIntensityIsActive}
            value={manualIntensity.value}
            style={styles.slider}
          />
        </AnimatedBlurView>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  innerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 250,
    height: 250,
  },
  blurredText: {
    position: 'absolute',
    padding: 10,
    backgroundColor: 'rgb(120,20,20)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
    borderRadius: 5,
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    paddingTop: 20,
  },
  nonBlurredText: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: 'rgb(120,20,20)',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  slider: {
    position: 'absolute',
    bottom: 10,
  },
});
