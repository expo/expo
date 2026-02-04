import { GlassStyle, GlassView, GlassViewProps } from 'expo-glass-effect';
import { StyleSheet, Text, View, Image, Pressable } from 'react-native';
import Animated, {
  useAnimatedProps,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

export default function GlassOpacityAnimationExample({
  selectedStyle,
}: {
  selectedStyle: GlassStyle;
}) {
  const fadeOpacity = useSharedValue(0);

  const glassViewProps = useAnimatedProps<GlassViewProps>(() => {
    const glassEffectStyle = fadeOpacity.value > 0.01 ? selectedStyle : 'none';
    return {
      glassEffectStyle,
      style: {
        width: 150,
        height: 100,
        borderRadius: 12,
        position: 'absolute',
      },
    };
  });

  const fadeOpacityStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    opacity: fadeOpacity.value,
    width: 150,
    height: 100,
    borderRadius: 12,
  }));

  return (
    <>
      <Text style={styles.title}>Opacity Animation Workaround (iOS 26.1+)</Text>
      <View style={styles.backgroundContainer}>
        <Image
          style={styles.backgroundImage}
          source={{
            uri: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop',
          }}
        />
        <Animated.View style={fadeOpacityStyle}>
          <AnimatedGlassView animatedProps={glassViewProps} />
        </Animated.View>
      </View>

      <Pressable
        style={styles.toggleButton}
        onPress={() => {
          fadeOpacity.value = withTiming(fadeOpacity.value > 0.5 ? 0 : 1, { duration: 500 });
        }}>
        <Text style={styles.toggleButtonText}>Toggle Glass Visibility</Text>
      </Pressable>
    </>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  backgroundContainer: {
    height: 300,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  toggleButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
