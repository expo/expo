import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { color } from '@/tokens';

type Props = {
  glowHeight?: number;
};

/**
 * Static vector glow — ambient indigo leak over true-black substrate.
 * Avoids live blur on a full-screen backdrop.
 */
export function CinematicBackground({ glowHeight = 400 }: Props) {
  return (
    <View pointerEvents="none" style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: color.substrate }]} />
      <LinearGradient
        colors={[color.accentGlow, 'rgba(0, 0, 0, 0)']}
        style={[styles.glow, { height: glowHeight }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
});
