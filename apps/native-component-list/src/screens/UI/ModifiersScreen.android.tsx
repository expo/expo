import { Host, Box, Column, Text } from '@expo/ui/jetpack-compose';
import {
  imePadding,
  fillMaxWidth,
  fillMaxSize,
  height,
  background,
} from '@expo/ui/jetpack-compose/modifiers';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import * as React from 'react';
import { useState } from 'react';
import { ScrollView, Button, StyleSheet, View, TextInput } from 'react-native';

import { Section } from '../../components/Page';

export default function ModifiersScreen() {
  const [showImePadding, setShowImePadding] = useState(false);

  const tabbarHeight = useBottomTabBarHeight();

  return (
    <>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16 }}>
        <Section title="imePadding">
          <Button
            title={showImePadding ? 'Hide' : 'Show'}
            onPress={() => setShowImePadding((v) => !v)}
          />
          {showImePadding && (
            <TextInput
              placeholder="Focus me to see imePadding in action"
              placeholderTextColor="#333333"
              style={{
                marginTop: 20,
                padding: 10,
                borderWidth: 1,
                borderColor: '#CCCCCC',
                borderRadius: 4,
              }}
            />
          )}
        </Section>
      </ScrollView>
      {showImePadding && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Host style={{ position: 'absolute', inset: 0, marginBottom: -tabbarHeight }}>
            <Column verticalArrangement="bottom" modifiers={[fillMaxSize()]}>
              <Column
                modifiers={[imePadding(), fillMaxWidth(), height(120), background('#6200EE')]}>
                <Box
                  contentAlignment="center"
                  modifiers={[fillMaxWidth(), height(120 - tabbarHeight)]}>
                  <Text color="#ffffff">Above TabBar</Text>
                </Box>
                <Box
                  contentAlignment="center"
                  modifiers={[fillMaxWidth(), height(tabbarHeight), background('#3700B3')]}>
                  <Text color="#ffffff">Behind TabBar</Text>
                </Box>
              </Column>
            </Column>
          </Host>
        </View>
      )}
    </>
  );
}

ModifiersScreen.navigationOptions = {
  title: 'Modifiers',
};
