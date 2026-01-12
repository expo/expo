import { Host, Icon } from '@expo/ui/jetpack-compose';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Drawer } from 'expo-router/drawer';
import { StatusBar } from 'expo-status-bar';
import { ComponentProps } from 'react';
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
            drawerIcon: ({ focused }) =>
              DrawerIcon(
                focused
                  ? require('../assets/symbols/filled_home.xml')
                  : require('../assets/symbols/outline_home.xml')
              ),
          }}
        />
        <Drawer.Screen
          name="(saved)"
          options={{
            drawerLabel: 'Saved',
            drawerIcon: (focused) =>
              DrawerIcon(
                focused
                  ? require('../assets/symbols/filled_download_done.xml')
                  : require('../assets/symbols/download_done.xml')
              ),
          }}
        />
        <Drawer.Screen
          name="(history)"
          options={{
            drawerLabel: 'History',
            drawerIcon: (focused) =>
              DrawerIcon(
                focused
                  ? require('../assets/symbols/history_selected.xml')
                  : require('../assets/symbols/history.xml')
              ),
          }}
        />
        <Drawer.Screen
          name="(settings)"
          options={{
            drawerLabel: 'Settings',
            drawerIcon: (focused) =>
              DrawerIcon(
                focused
                  ? require('../assets/symbols/filled_settings.xml')
                  : require('../assets/symbols/outline_settings.xml')
              ),
          }}
        />
        <Drawer.Screen
          name="(about)"
          options={{
            drawerLabel: 'About',
            drawerIcon: (focused) =>
              DrawerIcon(
                focused
                  ? require('../assets/symbols/filled_info.xml')
                  : require('../assets/symbols/outline_info.xml')
              ),
          }}
        />
      </Drawer>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

function DrawerIcon(moduleId: ComponentProps<typeof Icon>['source']) {
  return (
    <Host matchContents>
      <Icon source={moduleId} size={24} tintColor="#323233" />
    </Host>
  );
}
