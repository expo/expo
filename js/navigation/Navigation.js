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
  tabBarIcon: ({ focused }) => renderIcon(Entypo, 'grid', 24, 'Projects', focused),
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
  tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-search', 24, 'Explore', focused),
  tabBarLabel: 'Explore',
  tabBarOnPress: ({ navigation }) => {
    if (!navigation.isFocused()) {
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
  tabBarIcon: ({ focused }) => renderIcon(Ionicons, 'ios-person', 26, 'Profile', focused),
  tabBarLabel: 'Profile',
};

const TabRoutes = {
  ProjectsStack,
  ExploreStack,
  ProfileStack,
};

const TabNavigator =
  Platform.OS === 'ios'
    ? createBottomTabNavigator(TabRoutes, {
        initialRouteName: 'ProfileStack',
        tabBarOptions: {
          showLabel: false,
          style: {
            backgroundColor: Colors.tabBar,
            borderTopColor: '#f2f2f2',
          },
        },
      })
    : createMaterialBottomTabNavigator(TabRoutes, {
        initialRouteName: 'ExploreStack', // 'ProjectsStack',
        activeTintColor: Colors.tabIconSelected,
      });

TabNavigator.navigationOptions = {
  header: null,
};

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
    navigationOptions: defaultNavigationOptions,
  }
);

export default createSwitchNavigator({ RootStack });

function renderIcon(
  IconComponent: any,
  iconName: string,
  iconSize: number,
  title: string,
  isSelected: boolean
) {
  let color = isSelected ? Colors.tabIconSelected : Colors.tabIconDefault;

  if (Platform.OS === 'ios') {
    return (
      <View style={styles.tabItemContainer}>
        <IconComponent name={iconName} size={iconSize} color={color} style={styles.icon} />

        <Text style={[styles.tabTitleText, { color }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  } else {
    return (
      <View style={styles.tabItemContainer}>
        <IconComponent name={iconName} size={iconSize + 4} color={color} style={styles.icon} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  icon: {
    marginBottom: Platform.OS === 'ios' ? -2 : 0,
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTitleText: {
    fontSize: 11,
  },
});
