import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import LinksScreen from '../screens/LinksScreen';
import SettingsScreen from '../screens/SettingsScreen';

const TabNavigator = createBottomTabNavigator();

const Stack = createStackNavigator();

export default function MainTabNavigator() {
  return (
    <TabNavigator.Navigator>
      <TabNavigator.Screen
        name="HomeStack"
        options={{
          title: 'Home',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              name={
                Platform.OS === 'ios'
                  ? `ios-information-circle${focused ? '' : '-outline'}`
                  : 'md-information-circle'
              }
            />
          ),
        }}>
        {() => (
          <Stack.Navigator>
            <Stack.Screen name="Home" component={HomeScreen} />
          </Stack.Navigator>
        )}
      </TabNavigator.Screen>
      <TabNavigator.Screen
        name="LinksStack"
        options={{
          title: 'Links',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name={Platform.OS === 'ios' ? 'ios-link' : 'md-link'} />
          ),
        }}>
        {() => (
          <Stack.Navigator>
            <Stack.Screen name="Links" component={LinksScreen} />
          </Stack.Navigator>
        )}
      </TabNavigator.Screen>
      <TabNavigator.Screen
        name="SettingsStack"
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              name={Platform.OS === 'ios' ? 'ios-options' : 'md-options'}
            />
          ),
        }}>
        {() => (
          <Stack.Navigator>
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </Stack.Navigator>
        )}
      </TabNavigator.Screen>
    </TabNavigator.Navigator>
  );
}
