import React, { Component } from 'react';
import PropTypes from 'prop-types';

import { ViewPropTypes, processColor, requireNativeComponent } from 'react-native';

export default class LinearGradient extends Component {
  static propTypes = {
    start: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.object]),
    end: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.object]),
    colors: PropTypes.arrayOf(PropTypes.string).isRequired,
    locations: PropTypes.arrayOf(PropTypes.number),
    ...ViewPropTypes,
  };

  render() {
    const { colors, locations, start, end, ...otherProps } = this.props;
    if (colors && locations && colors.length !== locations.length) {
      console.warn('LinearGradient colors and locations props should be arrays of the same length');
    }

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
      <NativeLinearGradient
        {...otherProps}
        colors={colors.map(processColor)}
        locations={locations ? locations.slice(0, colors.length) : null}
        startPoint={startProp}
        endPoint={endProp}
      />
    );
  }
}

const NativeLinearGradient = requireNativeComponent('ExponentLinearGradient', null);
