import React from 'react';
import { ScrollView, Text } from 'react-native';
import { useSafeArea, SafeAreaConsumer } from 'react-native-safe-area-context';

import HeadingText from '../components/HeadingText';

export default function SafeAreaContextScreen() {
  const insets = useSafeArea();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
      <HeadingText>Using useSafeArea hook</HeadingText>
      <Text style={{ marginVertical: 10 }}>{JSON.stringify(insets, null, 2)}</Text>
      <HeadingText>Using SafeAreaConsumer component</HeadingText>
      <SafeAreaConsumer>
        {consumerInsets => (
          <Text style={{ marginVertical: 10 }}>{JSON.stringify(consumerInsets, null, 2)}</Text>
        )}
      </SafeAreaConsumer>
    </ScrollView>
  );
}

SafeAreaContextScreen.navigationOptions = {
  title: 'Safe Area Context',
};
