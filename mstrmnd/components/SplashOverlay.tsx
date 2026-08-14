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
  const brandY = useSharedValue(24);
  const brandOp = useSharedValue(0);
  const markScale = useSharedValue(0.84);
  const pillars = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    brandOp.value = withDelay(160, withTiming(1, { duration: 850 }));
    brandY.value = withDelay(
      160,
      withTiming(0, { duration: 950, easing: Easing.out(Easing.cubic) }),
    );
    markScale.value = withDelay(
      100,
      withTiming(1, { duration: 1050, easing: Easing.out(Easing.cubic) }),
    );
    pillars.value = withDelay(750, withTiming(1, { duration: 700 }));

    const t = setTimeout(() => {
      opacity.value = withTiming(0, { duration: 600 });
      setTimeout(onDone, 620);
    }, 2800);

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
      <LinearGradient
        colors={['#000000', '#0A0A0C', '#000000']}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* soft spotlight */}
      <LinearGradient
        colors={['rgba(255,255,255,0.07)', 'rgba(255,255,255,0.0)']}
        style={styles.spot}
      />
      <View style={styles.center}>
        <Animated.View style={mark}>
          <BrandMark size={108} glow weight="bold" tone="chrome" />
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
  spot: {
    position: 'absolute',
    top: '18%',
    left: '15%',
    right: '15%',
    height: '42%',
    borderRadius: 999,
  },
  center: {
    alignItems: 'center',
    gap: 20,
    paddingHorizontal: 28,
  },
  wordmark: {
    fontFamily: 'Syne_800ExtraBold',
    fontSize: 40,
    color: colors.chromeHot,
    letterSpacing: 8,
    marginTop: 4,
  },
  tagline: {
    fontFamily: 'SpaceGrotesk_400Regular',
    color: colors.metal,
    fontSize: 11,
    letterSpacing: 1.2,
    textAlign: 'center',
    textTransform: 'uppercase',
    lineHeight: 18,
    maxWidth: 320,
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
