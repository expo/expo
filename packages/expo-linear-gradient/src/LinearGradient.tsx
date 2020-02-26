import PropTypes from 'prop-types';
import React from 'react';
import { ColorPropType, Platform, View, ViewPropTypes, processColor } from 'react-native';

import NativeLinearGradient from './NativeLinearGradient';

export type LinearGradientProps = {
  colors: string[];
  locations?: number[] | null;
  start?: LinearGradienPoint | null;
  end?: LinearGradienPoint | null;
} & React.ComponentProps<typeof View>;

export type LinearGradienPoint = { x: number; y: number } | [number, number];

export default class LinearGradient extends React.Component<LinearGradientProps> {
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
        colors={Platform.select({
          web: colors as any,
          default: colors.map(processColor),
        })}
        locations={locations}
        startPoint={_normalizePoint(start)}
        endPoint={_normalizePoint(end)}
      />
    );
  }
}

function _normalizePoint(
  point: LinearGradienPoint | null | undefined
): [number, number] | undefined {
  if (!point) {
    return undefined;
  }

  if (Array.isArray(point) && point.length !== 2) {
    console.warn('start and end props for LinearGradient must be of the format [x,y] or {x, y}');
    return undefined;
  }

  return Array.isArray(point) ? point : [point.x, point.y];
}
