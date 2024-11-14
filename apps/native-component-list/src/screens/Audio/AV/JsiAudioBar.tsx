import { Audio } from 'expo-av';
import { UnavailabilityError } from 'expo-modules-core';
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

// for some reason, iOS returns much smaller sample values
// TODO (barthap): Fix the root cause and normalize them between platforms
const inputRange = Platform.OS === 'ios' ? [0, 0.3] : [0, 1];

export function JsiAudioBar({
  sound,
  isPlaying,
}: {
  sound: Audio.Sound | undefined;
  isPlaying: boolean;
}) {
  const isJsiAudioSupported = React.useMemo(() => {
    try {
      // @ts-expect-error that method is private
      sound?._updateAudioSampleReceivedCallback();
      return true;
    } catch (e: unknown) {
      if (e instanceof UnavailabilityError) {
        return false;
      }
      throw e;
    }
  }, [sound]);

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

  React.useEffect(() => {
    if (isJsiAudioSupported && isPlaying && !sound?._onAudioSampleReceived) {
      sound?.setOnAudioSampleReceived((sample) => {
        const frames = sample.channels[0].frames;
        const frameSum = frames.slice(0, 200).reduce((prev, curr) => prev + curr ** 2, 0);
        const rmsValue = Math.sqrt(frameSum / 200);

        runOnUI(() => {
          audioRmsValue.value = rmsValue;
        })();
      });
    }
  }, [sound, isPlaying]);

  if (!isJsiAudioSupported) {
    return <Text style={styles.errorText}>JSI Audio is not supported on this platform</Text>;
  }

  if (!sound || !sound._onAudioSampleReceived) {
    return <Text style={styles.infoText}>Press play to set JSI audioSampleCallback</Text>;
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
