import { BlurTint, BlurView } from 'expo-blur';
import React from 'react';
import { Animated, Image, StyleSheet, View } from 'react-native';

const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

export default function BlurViewScreen() {
  const intensity = React.useMemo(() => new Animated.Value(0), []);

  React.useEffect(() => {
    _animate();
  }, []);

  const _animate = React.useCallback(() => {
    const animateInConfig = {
      duration: 2500,
      toValue: 100,
      useNativeDriver: false,
      isInteraction: false,
    };
    const animateOutconfig = {
      duration: 2500,
      toValue: 0,
      isInteraction: false,
      useNativeDriver: false,
    };

    Animated.timing(intensity, animateInConfig).start(() => {
      Animated.timing(intensity, animateOutconfig).start(_animate);
    });
  }, [intensity]);

  const uri = 'https://s3.amazonaws.com/exp-brand-assets/ExponentEmptyManifest_192.png';

  return (
    <View style={styles.container}>
      {(['default', 'light', 'dark'] as BlurTint[]).map((tint) => (
        <View key={tint} style={styles.wrapper}>
          <Image style={styles.image} source={{ uri }} />
          <AnimatedBlurView tint={tint} intensity={intensity} style={StyleSheet.absoluteFill} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  wrapper: {
    padding: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 180,
    height: 180,
  },
});
