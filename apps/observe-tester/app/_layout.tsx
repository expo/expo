import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import ExpoObserve, { ObserveRoot } from 'expo-observe';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

ExpoObserve.configure({
  environment: 'custom-env',
  dispatchingEnabled: true,
  dispatchInDebug: true,
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
