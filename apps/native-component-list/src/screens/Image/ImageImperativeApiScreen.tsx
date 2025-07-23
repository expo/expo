import { Image } from 'expo-image';
import React from 'react';
import { Button, ScrollView, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedRef,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

const REAImage = Animated.createAnimatedComponent(Image);
const REAView = Animated.createAnimatedComponent(View);

export default function ImageImperativeApiScreen() {
  const value = useSharedValue(50);
  const ref = useAnimatedRef<Image>();

  const animatedStyle = useAnimatedStyle(() => ({
    width: value.value,
    height: value.value,
  }));

  return (
    <ScrollView style={styles.container}>
      <Button
        title="animate to 500"
        onPress={() => {
          value.value = withTiming(500, { duration: 500 });
        }}
      />
      <Button
        title="animate to 50"
        onPress={() => {
          value.value = withTiming(50, { duration: 1000 });
        }}
      />
      <Button
        title="animate"
        onPress={() => {
          value.value = withRepeat(
            withSequence(withTiming(50, { duration: 500 }), withTiming(500, { duration: 500 })),
            2,
            true
          );
        }}
      />
      <Button
        title="lock image refresh"
        onPress={() => {
          ref.current?.lockResourceAsync();
        }}
      />
      <Button
        title="unlock image"
        onPress={() => {
          ref.current?.unlockResourceAsync();
        }}
      />
      <Button
        title="reload"
        onPress={() => {
          ref.current?.reloadAsync();
        }}
      />

      <REAView style={animatedStyle}>
        <REAImage
          ref={ref}
          style={[styles.image, animatedStyle]}
          source={require('../../../assets/images/large-example.jpg')}
          onLoad={console.log}
        />
      </REAView>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
    backgroundColor: 'red',
  },
});
