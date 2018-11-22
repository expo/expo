import PropTypes from 'prop-types';
import React from 'react';
import {
  ColorPropType,
  View,
  ViewPropTypes,
  processColor,
  requireNativeComponent,
} from 'react-native';

import NativeLinearGradient from './NativeLinearGradient';

type Props = {
  colors: string[];
  locations?: number[] | null;
  start?: Point | null;
  end?: Point | null;
} & React.ElementProps<View>;

type Point = { x: number; y: number } | [number, number];

export default class LinearGradient extends React.Component<Props> {
  static propTypes = {
    ...ViewPropTypes,
    colors: PropTypes.arrayOf(ColorPropType).isRequired,
    locations: PropTypes.arrayOf(PropTypes.number),
    start: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.object]),
    end: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.number), PropTypes.object]),
  };

  render() {
    let { colors, locations, start, end, ...props } = this.props;

    if (locations && colors.length !== locations.length) {
      console.warn('LinearGradient colors and locations props should be arrays of the same length');
      locations = locations.slice(0, colors.length);
    }

    return (
      <NativeLinearGradient
        {...props}
        colors={colors.map(processColor)}
        locations={locations}
        startPoint={start ? _normalizePoint(start) : undefined}
        endPoint={end ? _normalizePoint(end) : undefined}
      />
    );
  }
}

function _normalizePoint(point: Point): [number, number] {
  return Array.isArray(point) ? point : [point.x, point.y];
}
