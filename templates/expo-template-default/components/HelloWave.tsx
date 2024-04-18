import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";

import { ThemedText } from "@/components/ThemedText";

export function HelloWave() {
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(rotateAnimation, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(rotateAnimation, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]), { iterations: 4 }).start();
  }, []);

  const spin = rotateAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '25deg']
  });

  return (
    <Animated.View style={{ transform: [{ rotate: spin }] }}>
      <ThemedText style={styles.text}>👋</ThemedText>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 28,
    lineHeight: 32,
    marginTop: -6
  },
});
