import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import TabBarIcon from '../components/TabBarIcon';
import HomeScreen from '../screens/HomeScreen';
import LinksScreen from '../screens/LinksScreen';
import SettingsScreen from '../screens/SettingsScreen';

const BottomTab = createBottomTabNavigator();

const Stack = createStackNavigator();

function stackWrapperFactory(name, component) {
  return function() {
    return (
      <Stack.Navigator>
        <Stack.Screen name={name} component={component} />
      </Stack.Navigator>
    );
  };
}

const HomeStack = stackWrapperFactory('Home', HomeScreen);

const LinksStack = stackWrapperFactory('Links', LinksScreen);

const SettingsStack = stackWrapperFactory('Settings', SettingsScreen);

export default function MainTabNavigator() {
  return (
    <BottomTab.Navigator>
      <BottomTab.Screen
        name="HomeStack"
        component={HomeStack}
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
        }}
      />
      <BottomTab.Screen
        name="LinksStack"
        component={LinksStack}
        options={{
          title: 'Links',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon focused={focused} name={Platform.OS === 'ios' ? 'ios-link' : 'md-link'} />
          ),
        }}
      />
      <BottomTab.Screen
        name="SettingsStack"
        component={SettingsStack}
        options={{
          title: 'Settings',
          tabBarIcon: ({ focused }) => (
            <TabBarIcon
              focused={focused}
              name={Platform.OS === 'ios' ? 'ios-options' : 'md-options'}
            />
          ),
        }}
      />
    </BottomTab.Navigator>
  );
}
