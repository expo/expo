import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Tabs } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SymbolView } from 'expo-symbols';
import { Platform, useColorScheme } from 'react-native';

import HapticTab from '@/components/HapticTab';
import TabBarBackground from '@/components/TabBarBackground';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarButton: HapticTab,
          tabBarBackground: TabBarBackground,
          tabBarStyle: Platform.select({
            ios: {
              // Use a transparent background on iOS to show the blur effect
              position: 'absolute',
            },
            default: {},
          }),
        }}>
        <Tabs.Screen
          name="(flavours)"
          options={{
            title: 'Flavour List',
            tabBarIcon: ({ color }) => <SymbolView name="cup.and.saucer.fill" tintColor={color} />,
          }}
        />
        <Tabs.Screen
          name="(locations)"
          options={{
            title: 'Locations',
            tabBarIcon: ({ color }) => <SymbolView name="mappin.and.ellipse" tintColor={color} />,
          }}
        />
        <Tabs.Screen
          name="(map)"
          options={{
            title: 'Map',
            tabBarIcon: ({ color }) => <SymbolView name="map.fill" tintColor={color} />,
          }}
        />
        <Tabs.Screen
          name="(about)"
          options={{
            title: 'About',
            tabBarIcon: ({ color }) => <SymbolView name="info.circle.fill" tintColor={color} />,
          }}
        />
      </Tabs>

      <StatusBar style="auto" />
    </ThemeProvider>
  );
}
