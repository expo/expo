import { StackNavigationProp } from '@react-navigation/stack';
import * as React from 'react';
import { Button, Platform, ScrollView, Text, View } from 'react-native';
import {
  SafeAreaView,
  useSafeAreaInsets,
  SafeAreaInsetsContext,
} from 'react-native-safe-area-context';

import HeadingText from '../components/HeadingText';

export default function SafeAreaContextScreen({
  navigation,
}: {
  navigation: StackNavigationProp<any>;
}) {
  React.useLayoutEffect(() => {
    navigation.setOptions({
      title: 'Safe Area Context',
      header: () => null,
    });
  }, [navigation]);

  const [focused, setFocused] = React.useState<'hook' | 'view'>('hook');
  const insets = useSafeAreaInsets();

  if (focused === 'hook') {
    return (
      <SafeAreaInsetsContext.Consumer>
        {(consumerInsets) => (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{
              paddingTop: insets.top,
              paddingHorizontal: 16,
              paddingVertical: 8,
            }}>
            <HeadingText>Using useSafeArea hook</HeadingText>
            <Text style={{ marginVertical: 10 }}>{JSON.stringify(insets, null, 2)}</Text>
            <HeadingText>Using SafeAreaConsumer component</HeadingText>
            <Text style={{ marginVertical: 10 }}>{JSON.stringify(consumerInsets, null, 2)}</Text>
            <Button title="Switch to SafeAreaView" onPress={() => setFocused('view')} />
            <View style={{ marginVertical: Platform.OS === 'ios' ? 0 : 10 }} />
            <Button title="Go back to APIs" onPress={() => navigation.goBack()} />
          </ScrollView>
        )}
      </SafeAreaInsetsContext.Consumer>
    );
  } else {
    return (
      <SafeAreaView style={{ alignItems: 'center' }}>
        <HeadingText>Using SafeAreaView</HeadingText>
        <Text style={{ marginVertical: 10, textAlign: 'center' }}>
          If it works as expected then the above heading will not be obscured by a device notch or
          status bar.
        </Text>
        <Button
          title="Switch to SafeAreaConsumer & useSafeArea hook"
          onPress={() => setFocused('hook')}
        />
        <View style={{ marginVertical: Platform.OS === 'ios' ? 0 : 10 }} />
        <Button title="Go back to APIs" onPress={() => navigation.goBack()} />
      </SafeAreaView>
    );
  }
}
