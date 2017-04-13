/* @flow */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import {
  StackNavigation,
  TabNavigation,
  TabNavigationItem,
} from '@expo/ex-navigation';
import { Entypo, Ionicons } from '@expo/vector-icons';

import Colors from '../constants/Colors';
import defaultRouteConfig from './defaultRouteConfig';

export default class RootNavigation extends React.Component {
  _currentTab = 'projects';

  render() {
    return (
      <TabNavigation
        tabBarColor={Colors.tabBar}
        tabBarStyle={{ borderTopColor: '#f2f2f2' }}
        tabBarHeight={50}
        onTabPress={this._handleTabPress}
        id="main"
        navigatorUID="main"
        initialTab={this._currentTab}>
        <TabNavigationItem
          id="projects"
          renderIcon={isSelected =>
            this._renderIcon(Entypo, 'grid', 24, 'Projects', isSelected)}>
          <StackNavigation
            id="projects"
            navigatorUID="projects"
            initialRoute="projects"
            defaultRouteConfig={defaultRouteConfig}
          />
        </TabNavigationItem>

        <TabNavigationItem
          id="explore"
          renderIcon={isSelected =>
            this._renderIcon(
              Ionicons,
              'ios-search',
              24,
              'Explore',
              isSelected
            )}>
          <StackNavigation
            id="explore"
            navigatorUID="explore"
            initialRoute="explore"
            defaultRouteConfig={defaultRouteConfig}
          />
        </TabNavigationItem>

        <TabNavigationItem
          id="profile"
          renderIcon={isSelected =>
            this._renderIcon(
              Ionicons,
              'ios-person',
              26,
              'Profile',
              isSelected
            )}>
          <StackNavigation
            id="profile"
            navigatorUID="profile"
            initialRoute="profile"
            defaultRouteConfig={defaultRouteConfig}
          />
        </TabNavigationItem>
      </TabNavigation>
    );
  }

  _handleTabPress = tabKey => {
    if (this._currentTab !== tabKey) {
      this._currentTab = tabKey;
      return;
    }

    const navigatorForTab = this.props.navigation.getNavigator(tabKey);

    if (navigatorForTab.getCurrentIndex() > 0) {
      navigatorForTab.pop();
    }
  };

  _renderIcon(IconComponent, iconName, iconSize, title, isSelected) {
    let color = isSelected ? Colors.tabIconSelected : Colors.tabIconDefault;

    return (
      <View style={styles.tabItemContainer}>
        <IconComponent
          name={iconName}
          size={iconSize}
          color={color}
          style={styles.icon}
        />

        <Text style={[styles.tabTitleText, { color }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  icon: {
    marginBottom: -2,
  },
  tabItemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabTitleText: {
    fontSize: 11,
  },
});
