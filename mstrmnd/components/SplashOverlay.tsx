import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '@/constants/theme';

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function SplashOverlay({ visible, onDone }: Props) {
  const opacity = useSharedValue(1);
  const brandY = useSharedValue(18);
  const brandOp = useSharedValue(0);
  const line = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    brandOp.value = withDelay(200, withTiming(1, { duration: 700 }));
    brandY.value = withDelay(
      200,
      withTiming(0, { duration: 800, easing: Easing.out(Easing.cubic) }),
    );
    line.value = withDelay(500, withTiming(1, { duration: 900 }));

    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 550 }, (finished) => {
        if (finished) {
          // run on JS
        }
      });
      setTimeout(onDone, 580);
    }, 2100);

    return () => clearTimeout(t);
  }, [visible, opacity, brandOp, brandY, line, onDone]);

  const root = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const brand = useAnimatedStyle(() => ({
    opacity: brandOp.value,
    transform: [{ translateY: brandY.value }],
  }));
  const rule = useAnimatedStyle(() => ({
    transform: [{ scaleX: line.value }],
    opacity: line.value,
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.root, root]} pointerEvents="none">
      <LinearGradient colors={['#050607', '#0B0F14', '#070A0D']} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.Text style={[styles.brand, brand]}>mstrmnd</Animated.Text>
        <Animated.View style={[styles.rule, rule]} />
        <Animated.Text style={[styles.tag, brand]}>
          your tuned mastermind · pad grid online
        </Animated.Text>
      </View>
      <Text style={styles.boot}>BOOT // AGENT CONTROLLER</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.void,
  },
  center: {
    alignItems: 'center',
    gap: 14,
  },
  brand: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 52,
    color: colors.ink,
    letterSpacing: -1.5,
  },
  rule: {
    width: 120,
    height: 2,
    backgroundColor: colors.signal,
    borderRadius: 1,
  },
  tag: {
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.muted,
    fontSize: 12,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  boot: {
    position: 'absolute',
    bottom: 48,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.metal,
    fontSize: 10,
    letterSpacing: 2,
  },
});
