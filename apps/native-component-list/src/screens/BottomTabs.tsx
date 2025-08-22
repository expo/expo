import { createNativeBottomTabNavigator } from '@bottom-tabs/react-navigation';
import * as React from 'react';
import { Platform, Text, View } from 'react-native';

const HomeIcon = require('../../assets/images/expo.svg');
const ProfileIcon = require('../../assets/images/user.png');

const Tab = createNativeBottomTabNavigator();

function HomeScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home!</Text>
    </View>
  );
}

function ProfileScreen() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Profile!</Text>
    </View>
  );
}
export default function App() {
  return (
    <Tab.Navigator>
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: () => (Platform.OS === 'ios' ? { sfSymbol: 'house' } : HomeIcon),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: () => (Platform.OS === 'ios' ? { sfSymbol: 'person' } : ProfileIcon),
        }}
      />
    </Tab.Navigator>
  );
}
