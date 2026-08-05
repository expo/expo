import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

const CustomComponent = () => {
  const x = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: x.value }, { rotate: `${(x.value / 212) * 360}deg` }],
    };
  });

  useEffect(() => {
    x.value = withRepeat(
      withTiming(212, { duration: 2000, easing: Easing.out(Easing.cubic) }),
      -1,
      true
    );
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Custom React Native Component</Text>
      <View style={styles.bar}>
        <Text>Reanimated example</Text>
        <Animated.Text style={[styles.emoji, animatedStyle]}>😎</Animated.Text>
      </View>
    </View>
  );
};

export default CustomComponent;

const styles = StyleSheet.create({
  bar: {
    backgroundColor: 'white',
    height: 40,
    borderRadius: 20,
    width: 256,
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#60a5fa',
    gap: 32,
    borderRadius: 20,
  },
  emoji: {
    position: 'absolute',
    top: 4,
    left: 4,
    width: 40,
    height: 32,
    fontSize: 30,
    lineHeight: 32,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
  },
});
