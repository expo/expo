import React from 'react';
import { Platform, Text, StyleSheet, View } from 'react-native';
import Reanimated, {
  Extrapolate,
  interpolate,
  runOnUI,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

import Colors from '../../../constants/Colors';

// TODO: (alan) Moving this import causes `Platform.OS` to be undefined?
// eslint-disable-next-line import/order
import { AudioPlayer, useAudioSampleListener } from 'expo-audio';

// for some reason, iOS returns much smaller sample values
// TODO (barthap): Fix the root cause and normalize them between platforms
const inputRange = Platform.OS === 'ios' ? [0, 0.3] : [0, 1];

export function JsiAudioBar({ player, isPlaying }: { player: AudioPlayer; isPlaying: boolean }) {
  const audioRmsValue = useSharedValue(0);
  const animatedStyle = useAnimatedStyle(() => {
    const barWidth = interpolate(audioRmsValue.value, inputRange, [1, 500], Extrapolate.CLAMP);
    return {
      width: withSpring(barWidth, {
        mass: 1,
        damping: 500,
        stiffness: 1000,
      }),
    };
  }, [audioRmsValue]);

  useAudioSampleListener(player, (sample) => {
    const frames = sample.channels[0].frames;
    const frameSum = frames.slice(0, 200).reduce((prev, curr) => prev + curr ** 2, 0);
    const rmsValue = Math.sqrt(frameSum / 200);
    runOnUI(() => {
      audioRmsValue.value = rmsValue;
    })();
  });

  if (!player.isAudioSamplingSupported) {
    return <Text style={styles.errorText}>Audio sampling is not supported on this platform</Text>;
  }

  if (!isPlaying) {
    return <Text style={styles.infoText}>Press play to render waveform</Text>;
  }

  return (
    <View style={styles.barContainer}>
      <Reanimated.View style={[styles.bar, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  barContainer: {
    height: 19,
  },
  bar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.tintColor,
  },
  errorText: {
    color: Colors.errorBackground,
  },
  infoText: {
    color: Colors.tintColor,
  },
});
