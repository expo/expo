import {
  Stack,
  unstable_enablePerformanceIntegration,
  unstable_PerformanceObserver,
  type RouterPerformanceMark,
} from 'expo-router';
import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';

unstable_enablePerformanceIntegration();
new unstable_PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    // Expo Router records only its own marks on native.
    const { detail } = entry as RouterPerformanceMark;
    console.log(`[${entry.startTime.toFixed(1)}ms] ${entry.name}:`, detail);
  }
}).observe({ type: 'mark' });

export default function Layout() {
  return (
    <ThemeProvider
      value={{
        ...DarkTheme,
        colors: {
          ...DarkTheme.colors,
          card: '#1e1f25',
        },
      }}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
