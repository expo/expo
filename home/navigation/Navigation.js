/* @flow */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  createStackNavigator,
  createSwitchNavigator,
  createBottomTabNavigator,
} from 'react-navigation';
import { createMaterialBottomTabNavigator } from 'react-navigation-material-bottom-tabs';
import { Entypo, Ionicons } from '@expo/vector-icons';
import { Constants } from 'expo';

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

import Colors from '../constants/Colors';
import SearchBar from '../components/SearchBar';
import defaultNavigationOptions from './defaultNavigationOptions';

const ProjectsStack = createStackNavigator(
  {
    Projects: ProjectsScreen,
    Profile: ProfileScreen,
  },
  {
    initialRouteName: 'Projects',
    navigationOptions: defaultNavigationOptions,
    cardStyle: {
      backgroundColor: Colors.greyBackground,
    },
  }
);

ProjectsStack.navigationOptions = {
  tabBarIcon: ({ focused }) => renderIcon(Entypo, 'grid', 24, focused),
  tabBarLabel: 'Projects',
};

const ExploreSearchSwitch = createBottomTabNavigator(
  {
    Explore: ExploreScreen,
    Search: SearchScreen,
  },
  {
    tabBarComponent: null,
    navigationOptions: {
      tabBarVisible: false,
    },
  }
);

ExploreSearchSwitch.navigationOptions = ({ navigation }) => {
  let { routeName } = navigation.state.routes[navigation.state.index];

  return {
    header: null,
    title: routeName,
  };
};

const ExploreStack = createStackNavigator(
  {
    ExploreAndSearch: ExploreSearchSwitch,
    Profile: ProfileScreen,
    ProjectsForUser: ProjectsForUserScreen,
    SnacksForUser: SnacksForUserScreen,
  },
  {
    initialRouteName: 'ExploreAndSearch',
    navigationOptions: defaultNavigationOptions,
    cardStyle: {
      backgroundColor: Colors.greyBackground,
    },
  }
);

ExploreStack.navigationOptions = {
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
    }
  },
};

const ProfileStack = createStackNavigator(
  {
    Profile: ProfileScreen,
    UserSettings: UserSettingsScreen,
    ProjectsForUser: ProjectsForUserScreen,
    SnacksForUser: SnacksForUserScreen,
  },
  {
    initialRouteName: 'Profile',
    navigationOptions: defaultNavigationOptions,
    cardStyle: {
      backgroundColor: Colors.greyBackground,
    },
  }
);

ProfileStack.navigationOptions = {
  tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-person', 26, focused),
  tabBarLabel: 'Profile',
};

const TabRoutes =
  Platform.OS === 'android' || !Constants.isDevice
    ? {
        ProjectsStack,
        ExploreStack,
        ProfileStack,
      }
    : {
        ProjectsStack,
        ProfileStack,
      };

const TabNavigator =
  Platform.OS === 'ios'
    ? createBottomTabNavigator(TabRoutes, {
        initialRouteName: 'ProfileStack',
        tabBarOptions: {
          style: {
            backgroundColor: Colors.tabBar,
            borderTopColor: '#f2f2f2',
          },
        },
      })
    : createMaterialBottomTabNavigator(TabRoutes, {
        initialRouteName: 'ProjectsStack',
        activeTintColor: Colors.tabIconSelected,
        inactiveTintColor: Colors.tabIconDefault,
        barStyle: {
          backgroundColor: '#fff',
        },
      });

TabNavigator.navigationOptions = {
  header: null,
};

export default createStackNavigator(
  {
    Tabs: TabNavigator,
    SignIn: SignInScreen,
    SignUp: SignUpScreen,
    QRCode: QRCodeScreen,
  },
  {
    initialRouteName: 'Tabs',
    mode: 'modal',
    navigationOptions: defaultNavigationOptions,
  }
);

function renderIcon(IconComponent: any, iconName: string, iconSize: number, isSelected: boolean) {
  let color = isSelected ? Colors.tabIconSelected : Colors.tabIconDefault;

  return (
    <IconComponent
      name={iconName}
      size={Platform.OS === 'ios' ? iconSize : iconSize + 4}
      color={color}
      style={styles.icon}
    />
  );
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -2 : 0,
  },
});
