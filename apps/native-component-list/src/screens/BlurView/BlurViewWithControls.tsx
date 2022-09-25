import { BlurTint, BlurView } from 'expo-blur';
import React, { useState, useCallback, useRef, memo } from 'react';
import { View, StyleSheet, Text, Image, Animated } from 'react-native';

import useResettingState from '../../utilities/useResettingState';
import Slider from './Slider';
import useLoopingAnimatedValue from './useLoopingAnimatedValue';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default memo((props: { tint: BlurTint }) => {
  const blurViewRef = useRef<View>(null);

  const animatedIntensity = useLoopingAnimatedValue(1, 100);
  const [manualIntensity, setManualIntensity] = useState(0);
  const [manualIntensityIsActive, setManualIntensityIsActive] = useResettingState(false, 3000);

  const handleSliderChange = useCallback((value: number) => {
    setManualIntensityIsActive(true);
    setManualIntensity(value);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.innerContainer}>
        <Image style={styles.image} source={{ uri: 'https://source.unsplash.com/300x300' }} />
        <Text style={styles.blurredText}>This text is blurred</Text>
        <AnimatedBlurView
          ref={blurViewRef}
          style={styles.blurView}
          intensity={manualIntensityIsActive ? manualIntensity : animatedIntensity}
          tint={props.tint}>
          <Text style={styles.nonBlurredText}>{props.tint}</Text>

          <Slider
            title="Manual intensity:"
            onChange={handleSliderChange}
            active={!!manualIntensityIsActive}
            value={manualIntensity}
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
