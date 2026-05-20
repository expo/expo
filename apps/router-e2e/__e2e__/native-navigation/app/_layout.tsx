import { Stack, unstable_navigationEvents } from 'expo-router';
import { DefaultTheme, ThemeProvider } from 'expo-router/react-navigation';

const appStart = Date.now();

unstable_navigationEvents.enable();
(['pagePreloaded', 'pageFocused', 'pageBlurred', 'pageRemoved'] as const).forEach((eventType) => {
  unstable_navigationEvents.addListener(eventType, (event) => {
    console.log(
      `[${Date.now() - appStart}ms] ${eventType}:`,
      event.pathname,
      event.params,
      event.screenId
    );
  });
});

export default function Layout() {
  return (
    <ThemeProvider
      value={{
        ...DefaultTheme,
        colors: {
          ...DefaultTheme.colors,
          text: '#0F0',
        },
      }}>
      <Stack screenOptions={{ headerShown: false }} />
    </ThemeProvider>
  );
}
