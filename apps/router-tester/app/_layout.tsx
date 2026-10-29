import {
  Slot,
  Stack,
  unstable_enablePerformanceIntegration,
  unstable_PerformanceObserver,
  useRootNavigationState,
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
  const rootState = useRootNavigationState();
  // A native Stack renders every route in its history, so use a Slot while any of them is a SplitView demo.
  const hasSplitView =
    rootState.routes[rootState.index]?.state?.routes.some((route) =>
      route.name.startsWith('split-view')
    ) ?? false;
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
      {hasSplitView ? <Slot /> : <Stack screenOptions={{ headerShown: false }} />}
    </ThemeProvider>
  );
}
