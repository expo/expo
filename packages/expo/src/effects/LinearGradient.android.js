import React, { Component } from 'react';
import PropTypes from 'prop-types';

import {
  StyleSheet,
  View,
  processColor,
  requireNativeComponent,
  ViewPropTypes,
} from 'react-native';

export default class LinearGradient extends Component {
  static propTypes = {
    start: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.object]),
    end: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.object]),
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    locations: PropTypes.arrayOf(PropTypes.number),
    ...ViewPropTypes,
  };

  render() {
    const { children, colors, end, locations, start, style, ...otherProps } = this.props;

    if (colors && locations && colors.length !== locations.length) {
      console.warn('LinearGradient colors and locations props should be arrays of the same length');
    }

    // inherit container borderRadius until this issue is resolved:
    // https://github.com/facebook/react-native/issues/3198
    const flatStyle = StyleSheet.flatten(style) || {};
    const borderRadius = flatStyle.borderRadius || 0;

    // this is the format taken by:
    // http://developer.android.com/reference/android/graphics/Path.html#addRoundRect(android.graphics.RectF, float[], android.graphics.Path.Direction)
    const borderRadiiPerCorner = [
      flatStyle.borderTopLeftRadius || borderRadius,
      flatStyle.borderTopLeftRadius || borderRadius,
      flatStyle.borderTopRightRadius || borderRadius,
      flatStyle.borderTopRightRadius || borderRadius,
      flatStyle.borderBottomRightRadius || borderRadius,
      flatStyle.borderBottomRightRadius || borderRadius,
      flatStyle.borderBottomLeftRadius || borderRadius,
      flatStyle.borderBottomLeftRadius || borderRadius,
    ];

    // support for current react-native-linear-gradient api
    let startProp = start;
    let endProp = end;
    if (start && start.x !== undefined && start.y !== undefined) {
      startProp = [start.x, start.y];
    }
    if (end && end.x !== undefined && end.y !== undefined) {
      endProp = [end.x, end.y];
    }

    return (
      <View {...otherProps} style={style}>
        <NativeLinearGradient
          style={{ position: 'absolute', top: 0, left: 0, bottom: 0, right: 0 }}
          colors={colors.map(processColor)}
          startPoint={startProp}
          endPoint={endProp}
          locations={locations ? locations.slice(0, colors.length) : null}
          borderRadii={borderRadiiPerCorner}
        />
        {children}
      </View>
    );
  }
}

const NativeLinearGradient = requireNativeComponent('ExponentLinearGradient', null);
