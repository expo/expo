import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

type Props = {
  color: string;
  active: boolean;
  intensity?: number;
  bars?: number;
};

/** Living waveform — gives each pad the illusion of process / breath */
export function LivingPulse({
  color,
  active,
  intensity = 0.4,
  bars = 5,
}: Props) {
  const phase = useSharedValue(0);
  const glow = useSharedValue(intensity);

  useEffect(() => {
    phase.value = withRepeat(
      withTiming(1, {
        duration: active ? 900 : 2400,
        easing: Easing.inOut(Easing.sin),
      }),
      -1,
      true,
    );
  }, [active, phase]);

  useEffect(() => {
    glow.value = withTiming(active ? Math.max(intensity, 0.65) : intensity * 0.5, {
      duration: 400,
    });
  }, [active, intensity, glow]);

  return (
    <View style={styles.row}>
      {Array.from({ length: bars }).map((_, i) => (
        <PulseBar
          key={i}
          index={i}
          color={color}
          phase={phase}
          glow={glow}
          active={active}
        />
      ))}
    </View>
  );
}

function PulseBar({
  index,
  color,
  phase,
  glow,
  active,
}: {
  index: number;
  color: string;
  phase: SharedValue<number>;
  glow: SharedValue<number>;
  active: boolean;
}) {
  const style = useAnimatedStyle(() => {
    const offset = index * 0.17;
    const wave = Math.sin((phase.value + offset) * Math.PI * 2);
    const base = active ? 0.35 : 0.18;
    const height = interpolate(wave, [-1, 1], [base, base + glow.value * 0.7]);
    return {
      height: `${Math.round(height * 100)}%`,
      opacity: 0.35 + glow.value * 0.55,
      backgroundColor: color,
    };
  });

  return <Animated.View style={[styles.bar, style]} />;
}

type OrbProps = {
  color: string;
  active: boolean;
};

export function LifeOrb({ color, active }: OrbProps) {
  const pulse = useSharedValue(0);
  const spin = useSharedValue(0);

  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(
        withTiming(1, { duration: active ? 700 : 1600 }),
        withTiming(0, { duration: active ? 700 : 1600 }),
      ),
      -1,
      false,
    );
    spin.value = withRepeat(
      withTiming(1, { duration: active ? 3200 : 8000, easing: Easing.linear }),
      -1,
      false,
    );
  }, [active, pulse, spin]);

  const core = useAnimatedStyle(() => ({
    transform: [{ scale: 0.85 + pulse.value * 0.28 }],
    opacity: 0.55 + pulse.value * 0.4,
    backgroundColor: color,
    shadowColor: color,
    shadowOpacity: 0.55 + pulse.value * 0.35,
    shadowRadius: 8 + pulse.value * 10,
  }));

  const ring = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${spin.value * 360}deg` },
      { scale: 0.95 + pulse.value * 0.12 },
    ],
    borderColor: color,
    opacity: active ? 0.7 : 0.25,
  }));

  const spark = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.65,
    transform: [{ translateY: interpolate(pulse.value, [0, 1], [4, -6]) }],
  }));

  return (
    <View style={styles.orbWrap}>
      <Animated.View style={[styles.ring, ring]} />
      <Animated.View style={[styles.core, core]} />
      <Animated.View style={[styles.spark, spark, { backgroundColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 3,
    height: 18,
    width: '100%',
  },
  bar: {
    width: 3,
    borderRadius: 2,
    minHeight: 3,
  },
  orbWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  core: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  ring: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  spark: {
    position: 'absolute',
    top: 2,
    right: 4,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
