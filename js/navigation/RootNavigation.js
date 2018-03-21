/* @flow */

import React from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { StackNavigation, TabNavigation, TabNavigationItem } from '@expo/ex-navigation';
import { Entypo, Ionicons } from '@expo/vector-icons';

import Colors from '../constants/Colors';
import defaultRouteConfig from './defaultRouteConfig';

export default class RootNavigation extends React.Component {
  _currentTab = (Platform.OS === 'ios' ) ? 'profile' : 'projects';

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
        {this._renderTabItems()}
      </TabNavigation>
    );
  }

  _renderTabItems = () => {
    let tabItems = [];

    tabItems.push(
      <TabNavigationItem
        key="projects"
        id="projects"
        renderIcon={isSelected => this._renderIcon(Entypo, 'grid', 24, 'Projects', isSelected)}>
        <StackNavigation
          id="projects"
          navigatorUID="projects"
          initialRoute="projects"
          defaultRouteConfig={defaultRouteConfig}
        />
      </TabNavigationItem>
    );

    if (Platform.OS === 'android') {
      tabItems.push(
        <TabNavigationItem
          key="explore"
          id="explore"
          renderIcon={isSelected =>
            this._renderIcon(Ionicons, 'ios-search', 24, 'Explore', isSelected)}>
          <StackNavigation
            id="explore"
            navigatorUID="explore"
            initialRoute="explore"
            defaultRouteConfig={defaultRouteConfig}
          />
        </TabNavigationItem>
      );
    }

    tabItems.push(
      <TabNavigationItem
        id="profile"
        key="profile"
        renderIcon={isSelected =>
          this._renderIcon(Ionicons, 'ios-person', 26, 'Profile', isSelected)}>
        <StackNavigation
          id="profile"
          navigatorUID="profile"
          initialRoute="profile"
          defaultRouteConfig={defaultRouteConfig}
        />
      </TabNavigationItem>
    );

    return tabItems;
  };

  _handleTabPress = (tabKey: string) => {
    if (this._currentTab !== tabKey) {
      this._currentTab = tabKey;
      return;
    }

    const navigatorForTab = this.props.navigation.getNavigator(tabKey);

    if (navigatorForTab.getCurrentIndex() > 0) {
      navigatorForTab.pop();
    }
  };

  _renderIcon(
    IconComponent: any,
    iconName: string,
    iconSize: number,
    title: string,
    isSelected: boolean
  ) {
    let color = isSelected ? Colors.tabIconSelected : Colors.tabIconDefault;

    return (
      <View style={styles.tabItemContainer}>
        <IconComponent name={iconName} size={iconSize} color={color} style={styles.icon} />

        <Text style={[styles.tabTitleText, { color }]} numberOfLines={1}>
          {title}
        </Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
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
