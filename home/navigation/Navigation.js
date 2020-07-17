/* @flow */

import { Entypo, Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Platform, StyleSheet } from 'react-native';
import { createAppContainer, useTheme } from 'react-navigation';
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
import { createStackNavigator } from 'react-navigation-stack';
import { BottomTabBar, createBottomTabNavigator } from 'react-navigation-tabs';

import Colors from '../constants/Colors';
import AudioDiagnosticsScreen from '../screens/AudioDiagnosticsScreen';
import DiagnosticsScreen from '../screens/DiagnosticsScreen';
import ExploreScreen from '../screens/ExploreScreen';
import GeofencingScreen from '../screens/GeofencingScreen';
import LocationDiagnosticsScreen from '../screens/LocationDiagnosticsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import ProjectsForUserScreen from '../screens/ProjectsForUserScreen';
import ProjectsScreen from '../screens/ProjectsScreen';
import QRCodeScreen from '../screens/QRCodeScreen';
import SignInScreen from '../screens/SignInScreen';
import SignUpScreen from '../screens/SignUpScreen';
import SnacksForUserScreen from '../screens/SnacksForUserScreen';
import UserSettingsScreen from '../screens/UserSettingsScreen';
import Environment from '../utils/Environment';
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

const ExploreStack = createStackNavigator(
  {
    ExploreAndSearch: ExploreScreen,
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

const ThemedTabBarComponent = props => {
  const theme = useTheme();

  return (
    <BottomTabBar
      {...props}
      style={{
        backgroundColor: Colors[theme].tabBar,
        borderTopColor: Colors[theme].navBorderBottom,
      }}
    />
  );
};

const TabNavigator =
  Platform.OS === 'ios'
    ? createBottomTabNavigator(TabRoutes, {
        initialRouteName: Environment.IsIOSRestrictedBuild ? 'ProfileStack' : 'ProjectsStack',
        navigationOptions: {
          headerShown: false,
        },
        tabBarComponent: ThemedTabBarComponent,
        tabBarOptions: {
          labelStyle: {
            fontWeight: '600',
          },
          activeTintColor: {
            light: Colors.light.tintColor,
            dark: Colors.light.tintColor,
          },
        },
      })
    : createMaterialBottomTabNavigator(TabRoutes, {
        initialRouteName: 'ProjectsStack',
        activeColor: Colors.tabIconSelected,
        inactiveColor: Colors.tabIconDefault,
        shifting: true,
        navigationOptions: {
          headerShown: false,
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
  const color = isSelected ? Colors[theme].tabIconSelected : Colors[theme].tabIconDefault;

  return <IconComponent name={iconName} size={iconSize} color={color} style={styles.icon} />;
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -3 : 0,
  },
});
