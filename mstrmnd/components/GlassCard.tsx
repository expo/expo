import { type ReactNode } from 'react';
import { Platform, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { blur, color, radius, space } from '@/tokens';

type Props = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  padded?: boolean;
  /** Stretch children when the card is a flex:1 region (windows, decks). */
  fill?: boolean;
};

/**
 * Glassmorphic surface: expo-blur on iOS + web, high-opacity dark
 * fallback on Android (no live backdrop-filter).
 */
export function GlassCard({
  children,
  style,
  intensity = blur.intensity,
  padded = true,
  fill = false,
}: Props) {
  const cardStyle = [styles.card, padded && styles.padded, fill && styles.fill, style];

  const body = (
    <>
      <LinearGradient
        colors={[color.glassTint, color.glassTintSoft]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        pointerEvents="none"
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.body, fill && styles.fill]}>{children}</View>
    </>
  );

  if (Platform.OS === 'ios' || Platform.OS === 'web') {
    return (
      <BlurView intensity={intensity} tint={blur.tint} style={cardStyle}>
        {body}
      </BlurView>
    );
  }

  return <View style={[cardStyle, styles.androidFallback]}>{body}</View>;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.hairline,
    overflow: 'hidden',
    position: 'relative',
  },
  body: {
    zIndex: 1,
  },
  fill: {
    flex: 1,
    minHeight: 0,
  },
  padded: {
    padding: space.lg,
  },
  androidFallback: {
    backgroundColor: color.glassFallback,
  },
});
