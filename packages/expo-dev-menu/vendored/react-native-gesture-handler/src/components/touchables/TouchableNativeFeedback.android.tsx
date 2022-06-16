import {
  Platform,
  TouchableNativeFeedbackProps,
  ColorValue,
} from 'react-native';
import * as React from 'react';
import { Component } from 'react';
import GenericTouchable, { GenericTouchableProps } from './GenericTouchable';

export type TouchableNativeFeedbackExtraProps = {
  borderless?: boolean;
  rippleColor?: number | null;
  rippleRadius?: number | null;
  foreground?: boolean;
};

/**
 * TouchableNativeFeedback behaves slightly different than RN's TouchableNativeFeedback.
 * There's small difference with handling long press ripple since RN's implementation calls
 * ripple animation via bridge. This solution leaves all animations' handling for native components so
 * it follows native behaviours.
 */
export default class TouchableNativeFeedback extends Component<
  TouchableNativeFeedbackProps & GenericTouchableProps
> {
  static defaultProps = {
    ...GenericTouchable.defaultProps,
    useForeground: true,
    extraButtonProps: {
      // Disable hiding ripple on Android
      rippleColor: null,
    },
  };

  // could be taken as RNTouchableNativeFeedback.SelectableBackground etc. but the API may change
  static SelectableBackground = (rippleRadius?: number) => ({
    type: 'ThemeAttrAndroid',
    // I added `attribute` prop to clone the implementation of RN and be able to use only 2 types
    attribute: 'selectableItemBackground',
    rippleRadius,
  });
  static SelectableBackgroundBorderless = (rippleRadius?: number) => ({
    type: 'ThemeAttrAndroid',
    attribute: 'selectableItemBackgroundBorderless',
    rippleRadius,
  });
  static Ripple = (
    color: ColorValue,
    borderless: boolean,
    rippleRadius?: number
  ) => ({
    type: 'RippleAndroid',
    color,
    borderless,
    rippleRadius,
  });

  static canUseNativeForeground = () => Platform.Version >= 23;

  getExtraButtonProps() {
    const extraProps: TouchableNativeFeedbackExtraProps = {};
    const { background } = this.props;
    if (background) {
      // I changed type values to match those used in RN
      // TODO(TS): check if it works the same as previous implementation - looks like it works the same as RN component, so it should be ok
      if (background.type === 'RippleAndroid') {
        extraProps['borderless'] = background.borderless;
        extraProps['rippleColor'] = background.color;
      } else if (background.type === 'ThemeAttrAndroid') {
        extraProps['borderless'] =
          background.attribute === 'selectableItemBackgroundBorderless';
      }
      // I moved it from above since it should be available in all options
      extraProps['rippleRadius'] = background.rippleRadius;
    }
    extraProps['foreground'] = this.props.useForeground;
    return extraProps;
  }
  render() {
    const { style = {}, ...rest } = this.props;
    return (
      <GenericTouchable
        {...rest}
        style={style}
        extraButtonProps={this.getExtraButtonProps()}
      />
    );
  }
}
