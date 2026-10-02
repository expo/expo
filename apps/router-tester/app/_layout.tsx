import { Stack, unstable_performance, unstable_PerformanceObserver } from 'expo-router';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';

unstable_performance.enable();
new unstable_PerformanceObserver((list) => {
  for (const entry of list.getEntries()) {
    console.log(`[${entry.startTime.toFixed(1)}ms] ${entry.name}:`, entry.detail);
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
