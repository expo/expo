/* @flow */

import React from 'react';
import { Animated, Platform, View } from 'react-native';
import { NavigationStyles, StackNavigation } from '@exponent/ex-navigation';
import CloseButton from '../components/CloseButton';
import defaultRouteConfig from '../navigation/defaultRouteConfig';

function withoutShadow(transition) {
  return {
    ...transition,
    sceneAnimations: props => ({
      ...transition.sceneAnimations(props),
      shadowOpacity: 0,
    }),
  };
}

export default class ModalScreen extends React.Component {
  static route = {
    styles: {
      ...withoutShadow(NavigationStyles.SlideVertical),
      configureTransition: () => ({
        timing: Animated.spring,
        speed: 25,
        bounciness: 0,
        useNativeDriver: Platform.OS === 'android',
      }),
      gestures: null,
    },
    navigationBar: {
      visible: false,
    },
  };

  render() {
    return (
      <View style={{ flex: 1, backgroundColor: '#000' }}>
        <StackNavigation
          initialRoute={this.props.route.params.initialRoute}
          defaultRouteConfig={{
            styles: (
              Platform.OS === 'android'
                ? NavigationStyles.Fade
                : withoutShadow(NavigationStyles.SlideHorizontalIOS)
            ),
            navigationBar: {
              visible: true,
              renderLeft: () => <CloseButton />,
              ...defaultRouteConfig.navigationBar,
            },
          }}
        />
      </View>
    );
  }
}
