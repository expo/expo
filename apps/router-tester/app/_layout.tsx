import {
  Slot,
  Stack,
  unstable_enablePerformanceIntegration,
  unstable_PerformanceObserver,
  useSegments,
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
  const segments = useSegments();
  return (
    <ThemeProvider
      value={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          background: '#fff',
        },
      }}>
      {/* SplitView cannot be inside a native navigator. */}
      {segments[0] === 'split-view-mail' ? (
        <Slot />
      ) : (
        <Stack screenOptions={{ headerShown: false }} />
      )}
    </ThemeProvider>
  );
}
