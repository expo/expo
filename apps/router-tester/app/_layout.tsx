import {
  Stack,
  unstable_enablePerformanceIntegration,
  unstable_PerformanceObserver,
  type RouterPerformanceMark,
} from 'expo-router';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';

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
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          text: '#0F0',
          background: '#00f',
        },
      }}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
