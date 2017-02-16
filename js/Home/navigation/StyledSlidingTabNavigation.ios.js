import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';

import { SlidingTabNavigation } from '@exponent/ex-navigation';

import { capitalize } from 'lodash';

import FeatureFlags from '../../FeatureFlags';

export default class StyledSlidingTabNavigation extends React.Component {
  render() {
    let { keyToTitle, children, ...props } = this.props;

    return (
      <SlidingTabNavigation
        {...props}
        tabBarStyle={[styles.tabBar, props.tabBarStyle]}
        renderIndicator={() => <View />}
        indicatorStyle={{ backgroundColor: '#fff' }}
        tabStyle={{
          flex: 0,
          paddingBottom: 12,
          paddingLeft: 12,
          paddingTop: 4,
          width: null,
        }}
        barBackgroundColor="#fff"
        position="top"
        getRenderLabel={this._getRenderLabel}
        pressColor="rgba(0,0,0,0.2)">
        {children}
      </SlidingTabNavigation>
    );
  }

  _getRenderLabel = props => scene => {
    const { route, index } = scene;

    let title;
    if (this.props.keyToTitle) {
      title = this.props.keyToTitle[route.key];
    } else {
      title = capitalize(route.key);
    }

    const selectedColor = '#0F73B6';
    const unselectedColor = '#232B3A';
    let color;

    if (FeatureFlags.DISPLAY_ALL_EXPLORE_TABS) {
      const inputRange = props.navigationState.routes.map((x, i) => i);
      const outputRange = inputRange.map(
        inputIndex => inputIndex === index ? selectedColor : unselectedColor,
      );
      color = props.position.interpolate({
        inputRange,
        outputRange,
      });
    } else {
      color = selectedColor;
    }

    return (
      <Animated.Text style={{ color, fontSize: 14 }}>
        {title}
      </Animated.Text>
    );
  };
}

const styles = StyleSheet.create({
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(36, 44, 58, 0.06)',
  },
});
