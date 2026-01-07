import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { useColorScheme } from 'react-native';

export default function Layout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Drawer screenOptions={{ headerShown: false }}>
        <Drawer.Screen
          name="(home)"
          options={{
            drawerLabel: 'Home',
            drawerIcon: () => <SymbolView name={{ android: 'home' }} size={24} />,
          }}
        />
        <Drawer.Screen
          name="(saved)"
          options={{
            drawerLabel: 'Saved',
            drawerIcon: () => <SymbolView name={{ android: 'download_done' }} size={24} />,
          }}
        />
        <Drawer.Screen
          name="(history)"
          options={{
            drawerLabel: 'History',
            drawerIcon: () => <SymbolView name={{ android: 'history' }} size={24} />,
          }}
        />
        <Drawer.Screen
          name="(settings)"
          options={{
            drawerLabel: 'Settings',
            drawerIcon: () => <SymbolView name={{ android: 'settings' }} size={24} />,
          }}
        />
        <Drawer.Screen
          name="(about)"
          options={{
            drawerLabel: 'About',
            drawerIcon: () => <SymbolView name={{ android: 'info' }} size={24} />,
          }}
        />
      </Drawer>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
