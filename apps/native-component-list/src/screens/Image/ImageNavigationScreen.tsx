import {
  createNativeStackNavigator,
  NativeStackNavigationProp,
} from '@react-navigation/native-stack';
import { Image } from 'expo-image';
import * as React from 'react';
import { Button, View, Text, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

type ScreenProps = {
  navigation: NativeStackNavigationProp<any>;
};

const Stack = createNativeStackNavigator();
const AnimatedImage = Animated.createAnimatedComponent(Image);

function FirstScreen({ navigation }: ScreenProps) {
  const width = useSharedValue(styles.image1.width);
  const height = useSharedValue(styles.image1.height);

  const imageStyle = useAnimatedStyle(() => {
    return {
      width: width.value,
      height: height.value,
    };
  });

  return (
    <View style={styles.screen}>
      <Text>First Screen</Text>
      <Button title="Go to second screen" onPress={() => navigation.push('Second')} />
      <Button
        title="Animate"
        onPress={() => {
          const newStyle = width.value === styles.image1.width ? styles.image2 : styles.image1;

          console.log(width.value, styles.image1.width, styles.image2.width, newStyle);

          width.value = withTiming(newStyle.width);
          height.value = withTiming(newStyle.height);
        }}
      />
      {/* <AnimatedImage
        style={styles.image1}
        sharedTransitionTag="image-memory"
        source="https://picsum.photos/seed/492/3000/2000"
        cachePolicy="memory"
      /> */}
      <AnimatedImage
        style={imageStyle}
        sharedTransitionTag="image-disk"
        source="https://picsum.photos/seed/692/3000/2000"
        cachePolicy="disk"
        priority="normal"
      />
    </View>
  );
}

function SecondScreen({ navigation }: ScreenProps) {
  return (
    <View style={styles.screen}>
      <Text>Second Screen</Text>
      <Button title="Go back" onPress={() => navigation.goBack()} />
      {/* <AnimatedImage
        style={styles.image2}
        sharedTransitionTag="image-memory"
        source="https://picsum.photos/seed/492/3000/2000"
        cachePolicy="memory"
      /> */}
      <AnimatedImage
        style={styles.image2}
        sharedTransitionTag="image-disk"
        source="https://picsum.photos/seed/693/3000/2000"
        cachePolicy="disk"
        priority="high"
      />
    </View>
  );
}

export default function ImageNavigationScreen() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="First" component={FirstScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Second" component={SecondScreen} options={{ headerShown: false }} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    paddingVertical: 30,
    alignItems: 'center',
  },
  image1: {
    marginVertical: 10,
    width: 300,
    height: 200,
  },
  image2: {
    marginVertical: 10,
    width: 360,
    height: 240,
  },
});
