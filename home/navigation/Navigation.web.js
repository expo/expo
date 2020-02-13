/* @flow */

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createBrowserApp } from '@react-navigation/web';
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
import { createStackNavigator } from 'react-navigation-stack';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { Entypo, Ionicons } from '@expo/vector-icons';

import ProjectsScreen from '../screens/ProjectsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import ProfileScreen from '../screens/ProfileScreen';
import SearchScreen from '../screens/SearchScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';
import ProjectsForUserScreen from '../screens/ProjectsForUserScreen';
import SnacksForUserScreen from '../screens/SnacksForUserScreen';
import Environment from '../utils/Environment';

import Colors from '../constants/Colors';
import defaultNavigationOptions from './defaultNavigationOptions';

const ProjectsStack = createStackNavigator(
  {
    Projects: ProjectsScreen,
    Profile: ProfileScreen,
  },
  {
    initialRouteName: 'Projects',
    headerMode: 'screen',
    navigationOptions: {
      tabBarIcon: ({ focused }) => renderIcon(Entypo, 'grid', 24, focused),
      tabBarLabel: 'Projects',
    },
    defaultNavigationOptions,
    cardStyle: {
      backgroundColor: Colors.light.greyBackground,
    },
  }
);

const ExploreSearchSwitch = createBottomTabNavigator(
  {
    Explore: ExploreScreen,
    Search: SearchScreen,
  },
  {
    tabBarComponent: null,
    navigationOptions: ({ navigation }) => {
      let { routeName } = navigation.state.routes[navigation.state.index];

      return {
        headerShown: false,
        title: routeName,
      };
    },
    defaultNavigationOptions: {
      tabBarVisible: false,
    },
  }
);

const ExploreStack = createStackNavigator(
  {
    ExploreAndSearch: ExploreSearchSwitch,
    Profile: ProfileScreen,
    ProjectsForUser: ProjectsForUserScreen,
    SnacksForUser: SnacksForUserScreen,
  },
  {
    initialRouteName: 'ExploreAndSearch',
    headerMode: 'screen',
    defaultNavigationOptions,
    navigationOptions: {
      tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-search', 24, focused),
      tabBarLabel: 'Explore',
      tabBarOnPress: ({ navigation, defaultHandler }) => {
        if (!navigation.isFocused()) {
          defaultHandler();
          return;
        }

        navigation.popToTop();

        if (navigation.state.routes[0].index > 0) {
          navigation.navigate('Explore');
        } else {
          navigation.emit('refocus');
        }
      },
    },
    cardStyle: {
      backgroundColor: Colors.light.greyBackground,
    },
  }
);

const ProfileStack = createStackNavigator(
  {
    Profile: ProfileScreen,
    UserSettings: UserSettingsScreen,
    ProjectsForUser: ProjectsForUserScreen,
    SnacksForUser: SnacksForUserScreen,
  },
  {
    initialRouteName: 'Profile',
    headerMode: 'screen',
    defaultNavigationOptions,
    navigationOptions: {
      tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-person', 26, focused),
      tabBarLabel: 'Profile',
    },
    cardStyle: {
      backgroundColor: Colors.light.greyBackground,
    },
  }
);

let TabRoutes = {
  ProjectsStack,
  ExploreStack,
  ProfileStack,
};
const TabNavigator =
  Platform.OS === 'ios'
    ? createBottomTabNavigator(TabRoutes, {
        initialRouteName: Environment.IsIOSRestrictedBuild ? 'ProfileStack' : 'ProjectsStack',
        navigationOptions: {
          headerShown: false,
        },
        tabBarOptions: {
          style: {
            backgroundColor: Colors.light.tabBar,
            borderTopColor: '#f2f2f2',
          },
        },
      })
    : createMaterialBottomTabNavigator(TabRoutes, {
        initialRouteName: 'ProjectsStack',
        activeTintColor: Colors.light.tabIconSelected,
        inactiveTintColor: Colors.light.tabIconDefault,
        navigationOptions: {
          headerShown: false,
        },
        barStyle: {
          backgroundColor: '#fff',
        },
      });

const RootStack = createStackNavigator(
  {
    Tabs: TabNavigator,
    SignIn: SignInScreen,
    SignUp: SignUpScreen,
    QRCode: QRCodeScreen,
  },
  {
    initialRouteName: 'Tabs',
    headerMode: 'screen',
    mode: 'modal',
    defaultNavigationOptions,
  }
);

export default createBrowserApp(RootStack);

function renderIcon(IconComponent: any, iconName: string, iconSize: number, isSelected: boolean) {
  let color = isSelected ? Colors.light.tabIconSelected : Colors.light.tabIconDefault;

  return <IconComponent name={iconName} size={iconSize} color={color} style={styles.icon} />;
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -3 : 0,
  },
});
