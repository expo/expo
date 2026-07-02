import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Observe, ObserveRoot } from 'expo-observe';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

Observe.configure({
  environment: 'custom-env',
  dispatchingEnabled: true,
  dispatchInDebug: true,
  integrations: {
    'expo-router': true,
    'expo-image': {
      oversizeThreshold: 1.5,
    },
  },
});

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <ObserveRoot>
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
