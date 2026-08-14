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
import { BrandMark } from '@/components/BrandMark';
import { brand, colors } from '@/constants/theme';

type Props = {
  visible: boolean;
  onDone: () => void;
};

export function SplashOverlay({ visible, onDone }: Props) {
  const opacity = useSharedValue(1);
  const brandY = useSharedValue(22);
  const brandOp = useSharedValue(0);
  const markScale = useSharedValue(0.86);
  const pillars = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    brandOp.value = withDelay(180, withTiming(1, { duration: 800 }));
    brandY.value = withDelay(
      180,
      withTiming(0, { duration: 900, easing: Easing.out(Easing.cubic) }),
    );
    markScale.value = withDelay(
      120,
      withTiming(1, { duration: 1000, easing: Easing.out(Easing.cubic) }),
    );
    pillars.value = withDelay(700, withTiming(1, { duration: 700 }));

    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 600 });
      setTimeout(onDone, 620);
    }, 2600);

    return () => clearTimeout(t);
  }, [visible, opacity, brandOp, brandY, markScale, pillars, onDone]);

  const root = useAnimatedStyle(() => ({ opacity: opacity.value }));
  const mark = useAnimatedStyle(() => ({
    opacity: brandOp.value,
    transform: [{ translateY: brandY.value }, { scale: markScale.value }],
  }));
  const copy = useAnimatedStyle(() => ({
    opacity: brandOp.value,
    transform: [{ translateY: brandY.value }],
  }));
  const footer = useAnimatedStyle(() => ({ opacity: pillars.value }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.root, root]} pointerEvents="none">
      <LinearGradient colors={['#000000', '#08080A', '#000000']} style={StyleSheet.absoluteFill} />
      <View style={styles.center}>
        <Animated.View style={mark}>
          <BrandMark size={96} />
        </Animated.View>
        <Animated.Text style={[styles.wordmark, copy]}>{brand.wordmark}</Animated.Text>
        <Animated.Text style={[styles.tagline, copy]}>{brand.tagline}</Animated.Text>
      </View>
      <Animated.Text style={[styles.pillars, footer]}>
        {brand.pillars.map((p) => p.toUpperCase()).join('  ·  ')}
      </Animated.Text>
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
    gap: 18,
    paddingHorizontal: 28,
  },
  wordmark: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 34,
    color: colors.chromeHot,
    letterSpacing: 10,
    marginTop: 8,
  },
  tagline: {
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.metal,
    fontSize: 11,
    letterSpacing: 1.1,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 18,
    maxWidth: 300,
  },
  pillars: {
    position: 'absolute',
    bottom: 48,
    fontFamily: 'SpaceGrotesk_500Medium',
    color: colors.muted,
    fontSize: 9,
    letterSpacing: 2.4,
  },
});
