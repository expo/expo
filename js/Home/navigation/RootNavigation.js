import React from 'react';
import {
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  StackNavigation,
  TabNavigation,
  TabNavigationItem,
} from '@exponent/ex-navigation';
import {
  Entypo,
  Ionicons,
} from '@exponent/vector-icons';

import Colors from '../constants/Colors';
import defaultRouteConfig from './defaultRouteConfig';

export default class RootNavigation extends React.Component {
  render() {
    return (
      <TabNavigation
        tabBarColor={Colors.tabBar}
        tabBarStyle={{borderTopColor: '#f2f2f2'}}
        tabBarHeight={50}
        initialTab="projects">
        <TabNavigationItem
          id="projects"
          renderIcon={isSelected => this._renderIcon(Entypo, 'grid', 24, 'Projects', isSelected)}>
          <StackNavigation
            defaultRouteConfig={defaultRouteConfig}
            initialRoute="projects"
          />
        </TabNavigationItem>

        <TabNavigationItem
          id="explore"
          renderIcon={isSelected => this._renderIcon(Ionicons, 'ios-search', 24, 'Explore', isSelected)}>
          <StackNavigation
            defaultRouteConfig={defaultRouteConfig}
            initialRoute="explore"
          />
        </TabNavigationItem>

        <TabNavigationItem
          id="profile"
          renderIcon={isSelected => this._renderIcon(Ionicons, 'ios-person', 26, 'Profile', isSelected)}>
          <StackNavigation
            defaultRouteConfig={defaultRouteConfig}
            initialRoute="profile" />
        </TabNavigationItem>
      </TabNavigation>
    );
  }

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

        <Text
          style={[styles.tabTitleText, {color}]}
          numberOfLines={1}>
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
