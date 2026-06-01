import { Host, Box, Column, Text } from '@expo/ui/jetpack-compose';
import {
  imePadding,
  fillMaxWidth,
  fillMaxSize,
  height,
  size,
  background,
  border,
  clip,
  dropShadow,
  innerShadow,
  Shapes,
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
        <Section title="dropShadow">
          <Host style={{ height: 160 }}>
            <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
              <Box
                modifiers={[
                  size(120, 120),
                  dropShadow(Shapes.RoundedCorner(24), {
                    radius: 16,
                    spread: 4,
                    color: '#6200EE',
                    offsetX: 0,
                    offsetY: 8,
                  }),
                  background('#FFFFFF'),
                  clip(Shapes.RoundedCorner(24)),
                ]}
              />
            </Box>
          </Host>
        </Section>
        <Section title="innerShadow">
          <Host style={{ height: 160 }}>
            <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
              <Box
                modifiers={[
                  size(120, 120),
                  clip(Shapes.RoundedCorner(24)),
                  background('#FFFFFF'),
                  innerShadow(Shapes.RoundedCorner(24), {
                    radius: 16,
                    spread: 2,
                    color: '#000000',
                    offsetX: 4,
                    offsetY: 6,
                  }),
                ]}
              />
            </Box>
          </Host>
        </Section>
        <Section title="Neobrutalist shadow">
          <Host style={{ height: 160 }}>
            <Box contentAlignment="center" modifiers={[fillMaxSize()]}>
              <Box
                modifiers={[
                  size(120, 120),
                  dropShadow(Shapes.Rectangle, {
                    radius: 0,
                    spread: 0,
                    offsetX: 8,
                    offsetY: 8,
                    color: '#000000',
                  }),
                  border(4, '#000000'),
                  background('#FFD43B'),
                ]}
              />
            </Box>
          </Host>
        </Section>
        <Section title="Neumorphic shadow">
          <Host style={{ height: 160 }}>
            <Box
              contentAlignment="center"
              modifiers={[fillMaxSize(), background('#E0E0E0')]}>
              <Box
                modifiers={[
                  size(120, 120),
                  dropShadow(Shapes.RoundedCorner(24), {
                    radius: 15,
                    offsetX: -10,
                    offsetY: -10,
                    color: '#FFFFFF',
                  }),
                  dropShadow(Shapes.RoundedCorner(24), {
                    radius: 15,
                    offsetX: 10,
                    offsetY: 10,
                    color: '#B1B1B1',
                  }),
                  background('#E0E0E0'),
                  clip(Shapes.RoundedCorner(24)),
                ]}
              />
            </Box>
          </Host>
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
