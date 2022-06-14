import {
  Animated,
  Easing,
  StyleSheet,
  View,
  TouchableOpacityProps,
} from 'react-native';
import GenericTouchable, {
  TOUCHABLE_STATE,
  GenericTouchableProps,
} from './GenericTouchable';
import * as React from 'react';
import { Component } from 'react';

/**
 * TouchableOpacity bases on timing animation which has been used in RN's core
 */
export default class TouchableOpacity extends Component<
  TouchableOpacityProps & GenericTouchableProps
> {
  static defaultProps = {
    ...GenericTouchable.defaultProps,
    activeOpacity: 0.2,
  };

  // opacity is 1 one by default but could be overwritten
  getChildStyleOpacityWithDefault = () => {
    const childStyle = StyleSheet.flatten(this.props.style) || {};
    return childStyle.opacity == null ? 1 : childStyle.opacity;
  };

  opacity = new Animated.Value(this.getChildStyleOpacityWithDefault());

  setOpacityTo = (value: number, duration: number) => {
    Animated.timing(this.opacity, {
      toValue: value,
      duration: duration,
      easing: Easing.inOut(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  onStateChange = (_from: number, to: number) => {
    if (to === TOUCHABLE_STATE.BEGAN) {
      this.setOpacityTo(this.props.activeOpacity!, 0);
    } else if (
      to === TOUCHABLE_STATE.UNDETERMINED ||
      to === TOUCHABLE_STATE.MOVED_OUTSIDE
    ) {
      this.setOpacityTo(this.getChildStyleOpacityWithDefault(), 150);
    }
  };

  render() {
    const { style = {}, ...rest } = this.props;
    return (
      <GenericTouchable
        {...rest}
        style={[
          style,
          {
            opacity: (this.opacity as unknown) as number, // TODO: fix this
          },
        ]}
        onStateChange={this.onStateChange}>
        {this.props.children ? this.props.children : <View />}
      </GenericTouchable>
    );
  }
}
