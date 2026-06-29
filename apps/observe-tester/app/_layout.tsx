import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Observe, ObserveRoot } from 'expo-observe';
import { Stack } from 'expo-router';
import { StyleSheet, Text, useColorScheme, View } from 'react-native';

Observe.configure({
  environment: 'custom-env',
  dispatchingEnabled: true,
  dispatchInDebug: true,
  integrations: {
    'expo-router': true,
  },
});

// Passing `errorBoundaryFallback` opts the root into capturing render-phase errors: the boundary
// records them and renders this in place of the crashed app, instead of leaving them to React
// Native's default crash behavior.
function RootErrorFallback() {
  return (
    <View style={styles.fallback}>
      <Text style={styles.fallbackText}>Something went wrong. The error was recorded.</Text>
    </View>
  );
}

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ObserveRoot errorBoundaryFallback={<RootErrorFallback />}>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </ThemeProvider>
    </ObserveRoot>
  );
}

const styles = StyleSheet.create({
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  fallbackText: {
    fontSize: 16,
    textAlign: 'center',
  },
});
