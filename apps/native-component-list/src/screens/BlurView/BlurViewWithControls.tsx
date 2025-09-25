import { BlurTint, BlurView, ExperimentalBlurMethod, BlurTargetView } from 'expo-blur';
import { Image } from 'expo-image';
import React, { useCallback, memo, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import Slider from './Slider';
import useResettingState from '../../utilities/useResettingState';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default memo((props: { tint: BlurTint; blurMethod: ExperimentalBlurMethod }) => {
  const expoImage = require('../../../assets/images/logo-wordmark.png');
  const backgroundImage = require('../../../assets/images/large-example.jpg');
  const animatedIntensity = useSharedValue<number | undefined>(100);
  const manualIntensity = useSharedValue<number | undefined>(0);
  const [manualIntensityIsActive, setManualIntensityIsActive] = useResettingState(false, 3000);
  const [manualIntensityState, setManualIntensityState] = useState(0);
  const blurTargetRef = useRef<View | null>(null);

  const handleSliderChange = useCallback((value: number) => {
    setManualIntensityIsActive(true);
    setManualIntensityState(value);
    manualIntensity.value = value;
  }, []);

  useEffect(() => {
    animatedIntensity.value = withRepeat(withTiming(0, { duration: 2000 }), -1, true);
  }, []);

  return (
    <View style={styles.container}>
      <View>
        <BlurTargetView ref={blurTargetRef} style={styles.blurTarget}>
          <Image style={styles.backgroundImage} contentFit="cover" source={backgroundImage} />
        </BlurTargetView>
        <AnimatedBlurView
          blurTarget={blurTargetRef}
          style={styles.blurView}
          tint={props.tint}
          intensity={manualIntensityIsActive ? manualIntensity : animatedIntensity}
          experimentalBlurMethod={props.blurMethod}>
          <Text style={styles.nonBlurredText}>{props.tint}</Text>
          <Slider
            title="Manual intensity:"
            onChange={handleSliderChange}
            active={!!manualIntensityIsActive}
            value={manualIntensityState}
            style={styles.slider}
          />
          <Image style={styles.image} contentFit="contain" tintColor="white" source={expoImage} />
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
  blurTarget: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 300,
    height: 300,
  },
  innerContainer: {
    width: 300,
    height: 300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 250,
    height: 300,
    position: 'absolute',
  },
  backgroundImage: {
    width: 300,
    height: 300,
    position: 'absolute',
  },
  blurredText: {
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
