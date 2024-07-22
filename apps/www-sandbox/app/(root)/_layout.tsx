import { Slot, Stack, Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';
import SideBarNav from '@/components/www/side-bar';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Layout() {
  return (
    <View
      style={{
        flex: 1,
        flexDirection: 'row',
        // paddingTop: useSafeAreaInsets().top
      }}>
      {/* <Stack.Screen options={{ headerShown: false }} /> */}
      {/* <SideBarNav /> */}
      <Tabs
        screenOptions={{
          headerShown: false,
        }}
      />
    </View>
  );
  if (process.env.EXPO_OS === 'web') {
    return (
      <View style={{ flex: 1 }}>
        <SideBarNav />
        <Slot />
      </View>
    );
  }
  return (
    <View style={{ flex: 1 }}>
      <Tabs screenOptions={{}}>
        <Tabs.Screen
          name="index"
          options={{
            tabBarIcon(props) {
              return <Ionicons name="home" size={24} color={props.color} />;
            },
            tabBarLabel(props) {
              return null;
            },
          }}
        />
      </Tabs>
    </View>
  );
}
