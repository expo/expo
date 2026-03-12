import { Host, Box, Column, Text } from '@expo/ui/jetpack-compose';
import {
  imePadding,
  safeDrawingPadding,
  fillMaxWidth,
  fillMaxSize,
  height,
  background,
} from '@expo/ui/jetpack-compose/modifiers';
import { useBottomTabBarHeight } from '@react-navigation/bottom-tabs';
import { useState } from 'react';
import { Button, StyleSheet, View, TextInput } from 'react-native';

import { Page, Section } from '../../components/Page';

export default function ModifiersScreen() {
  const [showImePadding, setShowImePadding] = useState(false);
  const [showSafePadding, setShowSafePadding] = useState(false);
  const [safePaddingActive, setSafePaddingActive] = useState(true);

  const tabbarHeight = useBottomTabBarHeight();

  return (
    <>
      <Page>
        <Section title="imePadding">
          <Button
            title={showImePadding ? 'Hide' : 'Show'}
            onPress={() => setShowImePadding((v) => !v)}
          />
          {showImePadding && (
            <TextInput
              placeholder="Focus me to see imePadding in action"
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

        <Section title="safeDrawingPadding">
          <Button
            title={showSafePadding ? 'Hide' : 'Show'}
            onPress={() => setShowSafePadding((v) => !v)}
          />
          {showSafePadding && (
            <Button
              title={safePaddingActive ? 'Deactivate' : 'Activate'}
              onPress={() => setSafePaddingActive((v) => !v)}
            />
          )}
        </Section>
      </Page>
      {showImePadding && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Host style={{ position: 'absolute', inset: 0, marginBottom: -tabbarHeight }}>
            <Column verticalArrangement="bottom" modifiers={[fillMaxSize()]}>
              <Box modifiers={[imePadding(), fillMaxWidth(), height(120), background('#6200EE')]} />
            </Column>
          </Host>
        </View>
      )}
      {showSafePadding && (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Host style={{ position: 'absolute', inset: 0, marginBottom: -tabbarHeight }}>
            <Column
              verticalArrangement="spaceBetween"
              modifiers={[fillMaxSize(), ...(safePaddingActive ? [safeDrawingPadding()] : [])]}>
              <Box modifiers={[fillMaxWidth(), height(80), background('#FF6347')]}>
                <Text color="#FFFFFF" style={{ fontWeight: '600', fontSize: 16 }}>
                  Top edge
                </Text>
              </Box>
              <Box modifiers={[fillMaxWidth(), height(80), background('#FF6347')]}>
                <Text color="#FFFFFF" style={{ fontWeight: '600', fontSize: 16 }}>
                  Bottom edge
                </Text>
              </Box>
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
