import * as Hinge from 'expo-hinge';
import { useAnimatedHinge } from 'expo-hinge/reanimated';
import * as React from 'react';
import { ScrollView, StyleSheet, TextInput } from 'react-native';
import Animated, { useAnimatedProps, useAnimatedStyle } from 'react-native-reanimated';

import Button from '../components/Button';
import HeadingText from '../components/HeadingText';
import MonoText from '../components/MonoText';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export default function HingeScreen() {
  const hinge = Hinge.useHinge();
  const [events, setEvents] = React.useState<string[]>([]);

  React.useEffect(() => {
    const subscription = Hinge.addHingeListener((event) => {
      setEvents((previous) => [JSON.stringify(event.hinge), ...previous].slice(0, 10));
    });
    return () => subscription.remove();
  }, []);

  return (
    <ScrollView style={{ padding: 10 }}>
      <HeadingText>useHinge()</HeadingText>
      <MonoText>{JSON.stringify(hinge, null, 2)}</MonoText>
      <HeadingText>useAnimatedHinge()</HeadingText>
      <AnimatedHinge />
      <HeadingText>Sync API</HeadingText>
      <MonoText>
        {JSON.stringify({ isAvailable: Hinge.isAvailable(), getHinge: Hinge.getHinge() }, null, 2)}
      </MonoText>
      <HeadingText>addHingeListener() events, latest first</HeadingText>
      <MonoText>{events.length ? events.join('\n') : 'Fold the device to see events.'}</MonoText>
    </ScrollView>
  );
}

function AnimatedHinge() {
  const hinge = useAnimatedHinge();

  const animatedProps = useAnimatedProps(() => {
    const text = JSON.stringify(hinge.get());
    return { text, defaultValue: text };
  });
  const lidStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${(hinge.get()?.angle ?? 180) - 180}deg` }],
  }));

  return (
    <>
      <AnimatedTextInput animatedProps={animatedProps} editable={false} style={styles.value} />
      <Animated.View style={[styles.lid, lidStyle]} />
      <Button
        title="Block the JavaScript thread for 15 seconds"
        onPress={() => {
          const end = Date.now() + 15000;
          while (Date.now() < end) {}
        }}
      />
    </>
  );
}

HingeScreen.navigationOptions = {
  title: 'Hinge',
};

const styles = StyleSheet.create({
  value: {
    fontSize: 10,
    padding: 6,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#666',
  },
  lid: {
    alignSelf: 'center',
    width: 160,
    height: 8,
    marginVertical: 24,
    borderRadius: 4,
    backgroundColor: 'gray',
    transformOrigin: 'left',
  },
});
