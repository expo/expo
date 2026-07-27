import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

// Android needs an xml drawable; iOS uses an SF Symbol. See ENG-22124.
const addIcon = require('@expo/material-symbols/add.xml');

/**
 * Minimal repro for ENG-22124: on Android the bottom `Stack.Toolbar` renders inside a
 * full-screen Jetpack Compose host that swallows touches, so the screen `Pressable` below
 * never fires. The toolbar button itself still works.
 */
export default function ToolbarPress() {
  const [pressed, setPressed] = useState(0);
  const [toolbarPressed, setToolbarPressed] = useState(0);

  return (
    <>
      <View style={styles.container}>
        <Pressable
          testID="press-target"
          style={styles.button}
          onPress={() => setPressed((n) => n + 1)}>
          <Text testID="press-count" style={styles.buttonText}>
            Pressed: {pressed}
          </Text>
        </Pressable>
        <Text testID="toolbar-count" style={styles.toolbarCount}>
          Toolbar: {toolbarPressed}
        </Text>
      </View>

      <Stack.Toolbar>
        <Stack.Toolbar.Spacer />
        <Stack.Toolbar.Button
          accessibilityLabel="toolbar-add-button"
          icon={process.env.EXPO_OS === 'ios' ? 'plus' : addIcon}
          onPress={() => setToolbarPressed((n) => n + 1)}
        />
        <Stack.Toolbar.Spacer />
      </Stack.Toolbar>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  button: {
    paddingVertical: 24,
    paddingHorizontal: 48,
    backgroundColor: '#4630eb',
    borderRadius: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  toolbarCount: {
    fontSize: 18,
    color: '#333',
  },
});
