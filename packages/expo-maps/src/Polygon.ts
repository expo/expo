import React from 'react';

import { Point, PatternItem } from './Common.types';

/**
 * Props of Polygon component of Expo Maps library.
 */
export type PolygonProps = {
  /**
   * Array of polygon's vertices.
   *
   * The polygon is closed automatically, so there is no need to repeat the first vertex at the end.
   *
   * If empty, the polygon will be invisible, but logically it will be registered on the host map.
   * @required
   */
  points: Point[];
  /**
   * Color of the polygon's interior (optional).
   *
   * Accepted formats:
   * * `'#RRGGBB'`
   * * `'#RRGGBBAA'`
   * * `'#RGB'`
   * * `'#RGBA'`
   * * 'red'
   * * 'blue'
   * * 'green'
   * * 'black'
   * * 'white'
   * * 'gray'
   * * 'cyan'
   * * 'magenta'
   * * 'yellow'
   * * 'lightgray'
   * * 'darkgray'
   * * 'grey'
   * * 'aqua'
   * * 'fuchsia'
   * * 'lime'
   * * 'maroon'
   * * 'navy'
   * * 'olive'
   * * 'purple'
   * * 'silver'
   * * 'teal'
   * @default transparent
   */
  fillColor?: string;
  /**
   * Color of the polygon's edge line (optional).
   *
   * Accepted formats:
   * * `'#RRGGBB'`
   * * `'#RRGGBBAA'`
   * * `'#RGB'`
   * * `'#RGBA'`
   * * 'red'
   * * 'blue'
   * * 'green'
   * * 'black'
   * * 'white'
   * * 'gray'
   * * 'cyan'
   * * 'magenta'
   * * 'yellow'
   * * 'lightgray'
   * * 'darkgray'
   * * 'grey'
   * * 'aqua'
   * * 'fuchsia'
   * * 'lime'
   * * 'maroon'
   * * 'navy'
   * * 'olive'
   * * 'purple'
   * * 'silver'
   * * 'teal'
   * @default 'black'
   */
  strokeColor?: string;
  /**
   * Width of the polygon's edge line (optional).
   * @default 1.0
   */
  strokeWidth?: number;
  /**
   * Array of objects of type PatternItem, specifying the pattern of the polygon's edge line (optional).
   *
   * * Unprovided will imply a solid line.
   * * Empty array will imply no visible line.
   * * Otherwise line pattern starts with first provided element and repeats.
   *
   * For detailed info see {@link PatternItem}
   */
  strokePattern?: PatternItem[];
  /**
   * Style of joints between polygon's line segments (optional).
   * * `'bevel'` - beveled joints between line segments
   * * `'miter'` - sharp joints between line segments
   * * `'round'` - rounded joints between line segments
   * @default 'miter'
   */
  jointType?: 'bevel' | 'miter' | 'round';
};

/**
 * Internal JSON object for representing polygons in Expo Maps library.
 *
 * See {@link PolygonProps} for more detail.
 */
export type PolygonObject = PolygonProps & {
  type: 'polygon';
};

/**
 * Polygon component of Expo Maps library.
 *
 * Draws customizable polygon on ExpoMap.
 * This component should be ExpoMap component child to work properly.
 *
 * See {@link PolygonProps} to learn more about props.
 */
export class Polygon extends React.Component<PolygonProps> {
  render() {
    return null;
  }
}
