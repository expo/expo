import { startLoggingRouterMetrics } from '@/router-metrics-integration';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import ExpoObserve, { AppMetricsRoot } from 'expo-observe';
import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

// Toggle to enable per screen router metrics logging
const IS_ROUTER_INTEGRATION_ENABLED = false;

if (IS_ROUTER_INTEGRATION_ENABLED) {
  startLoggingRouterMetrics();
}

ExpoObserve.configure({
  environment: 'custom-env',
  dispatchingEnabled: true,
  dispatchInDebug: true,
});

export default function RootLayout() {
  const scheme = useColorScheme();
  return (
    <AppMetricsRoot>
      <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack
          screenOptions={{
            headerShown: false,
          }}
        />
      </ThemeProvider>
    </AppMetricsRoot>
  );
}
