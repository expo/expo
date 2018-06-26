/* @flow */

import React, { PureComponent } from 'react';
import { Animated, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-navigation';
// import TabBarIcon from 'react-navigation/src/views/TabView/TabBarIcon';
import Touchable from 'react-native-platform-touchable';

import type {
  NavigationAction,
  NavigationRoute,
  NavigationState,
  NavigationScreenProp,
  Style,
} from 'react-navigation/src/TypeDefinition';

import type { TabScene } from 'react-navigation/src/views/TabView/TabView';

import { Colors } from '../constants';

type DefaultProps = {
  activeTintColor: string,
  activeBackgroundColor: string,
  inactiveTintColor: string,
  inactiveBackgroundColor: string,
  showLabel: boolean,
};

type Props = {
  activeTintColor: string,
  activeBackgroundColor: string,
  inactiveTintColor: string,
  inactiveBackgroundColor: string,
  position: Animated.Value,
  navigation: NavigationScreenProp<NavigationState, NavigationAction>,
  jumpToIndex: (index: number) => void,
  getLabel: (scene: TabScene) => ?(React.Element<*> | string),
  renderIcon: (scene: TabScene) => React.Element<*>,
  onPressTab: Function,
  showLabel: boolean,
  style?: Style,
  labelStyle?: Style,
  tabStyle?: Style,
  showIcon: boolean,
};

export default class TabBarBottom extends PureComponent<DefaultProps, Props, void> {
  // See https://developer.apple.com/library/content/documentation/UserExperience/Conceptual/UIKitUICatalog/UITabBar.html
  static defaultProps = {
    activeTintColor: '#3478f6', // Default active tint color in iOS 10
    activeBackgroundColor: 'transparent',
    inactiveTintColor: '#929292', // Default inactive tint color in iOS 10
    inactiveBackgroundColor: 'transparent',
    showLabel: true,
    showIcon: true,
  };

  props: Props;

  _renderLabel = (scene: TabScene) => {
    const {
      position,
      navigation,
      activeTintColor,
      inactiveTintColor,
      labelStyle,
      showLabel,
    } = this.props;
    if (showLabel === false) {
      return null;
    }
    const { index } = scene;
    const { routes } = navigation.state;
    // Prepend '-1', so there are always at least 2 items in inputRange
    const inputRange = [-1, ...routes.map((x: *, i: number) => i)];
    const outputRange = inputRange.map(
      (inputIndex: number) => (inputIndex === index ? activeTintColor : inactiveTintColor)
    );
    const color = position.interpolate({
      inputRange,
      outputRange,
    });

    const tintColor = scene.focused ? activeTintColor : inactiveTintColor;
    const label = this.props.getLabel({ ...scene, tintColor });
    if (typeof label === 'string') {
      return <Animated.Text style={[styles.label, { color }, labelStyle]}>{label}</Animated.Text>;
    }

    if (typeof label === 'function') {
      return label({ ...scene, tintColor });
    }

    return label;
  };

  _renderIcon = (scene: TabScene) => {
    const {
      position,
      navigation,
      activeTintColor,
      inactiveTintColor,
      renderIcon,
      showIcon,
    } = this.props;
    if (showIcon === false) {
      return null;
    }
    return null;
    return (
      <TabBarIcon
        position={position}
        navigation={navigation}
        activeTintColor={activeTintColor}
        inactiveTintColor={inactiveTintColor}
        renderIcon={renderIcon}
        scene={scene}
        style={styles.icon}
      />
    );
  };

  _handlePress = index => {
    const { jumpToIndex, navigation } = this.props;
    const previousIndex = navigation.state.index;

    if (this.props.onPressTab) {
      this.props.onPressTab(index, previousIndex, navigation, () => jumpToIndex(index));
    } else {
      jumpToIndex(index);
    }
  };

  render() {
    const {
      position,
      navigation,
      activeBackgroundColor,
      inactiveBackgroundColor,
      style,
      tabStyle,
    } = this.props;

    const { routes } = navigation.state;
    // Prepend '-1', so there are always at least 2 items in inputRange
    const inputRange = [-1, ...routes.map((x: *, i: number) => i)];
    return (
      <SafeAreaView style={[styles.tabBarContainer, style]} forceInset={{ bottom: 'always' }}>
        <Animated.View style={styles.tabBar}>
          {routes.map((route: NavigationRoute, index: number) => {
            const focused = index === navigation.state.index;
            const scene = { route, index, focused };
            const outputRange = inputRange.map(
              (inputIndex: number) =>
                inputIndex === index ? activeBackgroundColor : inactiveBackgroundColor
            );
            const backgroundColor = position.interpolate({
              inputRange,
              outputRange,
            });
            const justifyContent = this.props.showIcon ? 'flex-end' : 'center';
            return (
              <Touchable
                fallback={TouchableWithoutFeedback}
                background={Touchable.Ripple(Colors.tabIconSelected, true)}
                style={styles.tab}
                key={route.key}
                onLongPress={() => this._handlePress(index)}
                onPress={() => this._handlePress(index)}>
                <Animated.View style={[styles.tab, { backgroundColor, justifyContent }, tabStyle]}>
                  {this._renderIcon(scene)}
                  {this._renderLabel(scene)}
                </Animated.View>
              </Touchable>
            );
          })}
        </Animated.View>
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  tabBarContainer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(0, 0, 0, .3)',
    backgroundColor: '#f4f4f4', // Default background color in iOS 10
  },
  tabBar: {
    height: 49, // Default tab bar height in iOS 10
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  icon: {
    flexGrow: 1,
  },
  label: {
    textAlign: 'center',
    fontSize: 10,
    marginBottom: 1.5,
    backgroundColor: 'transparent',
  },
});
