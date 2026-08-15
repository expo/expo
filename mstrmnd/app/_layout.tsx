import '../polyfills';
import { useCallback, useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { ThemeProvider, DarkTheme } from '@react-navigation/native';
import {
  Syne_700Bold,
  Syne_800ExtraBold,
} from '@expo-google-fonts/syne';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';
import { ControllerProvider } from '@/context/ControllerContext';
import { MobileShell } from '@/components/MobileShell';
import { SplashOverlay } from '@/components/SplashOverlay';
import { linearNavigationTheme } from '@/tokens';
import { color } from '@/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const navigationTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    ...linearNavigationTheme.colors,
  },
  fonts: {
    ...DarkTheme.fonts,
    ...linearNavigationTheme.fonts,
  },
};

export default function RootLayout() {
  const [showBrandSplash, setShowBrandSplash] = useState(true);
  const [fontsLoaded] = useFonts({
    Syne_700Bold,
    Syne_800ExtraBold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync().catch(() => undefined);
    }
  }, [fontsLoaded]);

  const onSplashDone = useCallback(() => setShowBrandSplash(false), []);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={styles.root}>
      <ThemeProvider value={navigationTheme}>
        <MobileShell>
          <ControllerProvider>
            <StatusBar style="light" />
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: color.substrate, flex: 1 },
                animation: 'fade',
              }}
            />
            <SplashOverlay visible={showBrandSplash} onDone={onSplashDone} />
          </ControllerProvider>
        </MobileShell>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: color.substrate },
});
