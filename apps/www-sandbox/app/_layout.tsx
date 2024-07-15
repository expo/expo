import { Tabs } from 'expo-router';
import Ionicons from '@expo/vector-icons/Ionicons';
import { View } from 'react-native';

export default function Layout() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
        }}>
        <Tabs.Screen
          name="(index)"
          options={{
            tabBarIcon(props) {
              return <Ionicons name="home" size={24} color={props.color} />;
            },
            tabBarLabel(props) {
              return null;
            },
          }}
        />
        <Tabs.Screen
          name="(products)"
          options={{
            title: 'Products',
            tabBarIcon(props) {
              return <Ionicons name="star" size={24} color={props.color} />;
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
