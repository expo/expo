import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import { ThemedText } from '@/components/themed-text';

export function HelloWave() {
  return (
    <Animated.View
      style={{
        animationName: {
          '50%': { transform: [{ rotate: '25deg' }] },
        },
        animationFillMode: 'none',
        animationIterationCount: 4,
        animationDuration: '300ms',
      }}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6,
  },
});
