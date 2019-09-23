/* @flow */

import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { createStackNavigator } from 'react-navigation-stack';

import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
import { Entypo, Ionicons } from '@expo/vector-icons';

import ProjectsScreen from '../screens/ProjectsScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import AudioDiagnosticsScreen from '../screens/AudioDiagnosticsScreen';
import GeofencingScreen from '../screens/GeofencingScreen';
import LocationDiagnosticsScreen from '../screens/LocationDiagnosticsScreen';
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
    navigationOptions: ({ theme }) => ({
      tabBarIcon: ({ focused }) => renderIcon(Entypo, 'grid', 24, focused, theme),
      tabBarLabel: 'Projects',
    }),
    defaultNavigationOptions,
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
        header: null,
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
    defaultNavigationOptions,
    navigationOptions: ({ theme }) => ({
      tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-search', 24, focused, theme),
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
    }),
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
    defaultNavigationOptions,
    navigationOptions: ({ theme }) => ({
      tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-person', 26, focused, theme),
      tabBarLabel: 'Profile',
    }),
  }
);

const DiagnosticsStack = createStackNavigator(
  {
    Diagnostics: DiagnosticsScreen,
    Audio: AudioDiagnosticsScreen,
    Location: LocationDiagnosticsScreen,
    Geofencing: GeofencingScreen,
  },
  {
    initialRouteName: 'Diagnostics',
    defaultNavigationOptions,
    navigationOptions: ({ theme }) => ({
      tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-git-branch', 26, focused, theme),
      tabBarLabel: 'Diagnostics',
    }),
  }
);

let TabRoutes;

if (Platform.OS === 'android') {
  TabRoutes = {
    ProjectsStack,
    ExploreStack,
    ProfileStack,
  };
} else {
  if (Environment.IsIOSRestrictedBuild) {
    TabRoutes = {
      ProjectsStack,
      DiagnosticsStack,
      ProfileStack,
    };
  } else {
    TabRoutes = {
      ProjectsStack,
      ExploreStack,
      DiagnosticsStack,
      ProfileStack,
    };
  }
}
const TabNavigator =
  Platform.OS === 'ios'
    ? createBottomTabNavigator(TabRoutes, {
        initialRouteName: Environment.IsIOSRestrictedBuild ? 'ProfileStack' : 'ProjectsStack',
        navigationOptions: {
          header: null,
        },
        tabBarOptions: {
          activeTintColor: {
            light: Colors.light.tintColor,
            dark: Colors.light.tintColor,
          },
          style: {
            backgroundColor: Colors.tabBar,
            borderTopColor: 'rgba(46, 59, 76, 0.10)',
          },
        },
      })
    : createMaterialBottomTabNavigator(TabRoutes, {
        initialRouteName: 'ProjectsStack',
        activeColor: Colors.tabIconSelected,
        inactiveColor: Colors.tabIconDefault,
        shifting: true,
        navigationOptions: {
          header: null,
        },
        barStyleLight: {
          backgroundColor: '#fff',
        },
        barStyleDark: {
          backgroundColor: Colors.dark.cardBackground,
          borderTopWidth: StyleSheet.hairlineWidth * 2,
          borderTopColor: Colors.dark.cardSeparator,
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
    mode: 'modal',
    defaultNavigationOptions,
  }
);

export default createAppContainer(RootStack);

function renderIcon(
  IconComponent: any,
  iconName: string,
  iconSize: number,
  isSelected: boolean,
  theme: 'light' | 'dark'
) {
  let color = isSelected ? Colors[theme].tabIconSelected : Colors[theme].tabIconDefault;

  return <IconComponent name={iconName} size={iconSize} color={color} style={styles.icon} />;
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -3 : 0,
  },
});
