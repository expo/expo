import React from 'react';

import { Point, PatternItem } from './Common.types';

/**
 * Props of Polyline component of Expo Maps library.
 */
export type PolylineProps = {
  /**
   * Array of polygon's vertices.
   *
   * If empty, the polyline will be invisible, but logically it will be registered on the host map.
   * @required
   */
  points: Point[];
  /**
   * Polyline stroke color in hex format (optional).
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
  color?: string;
  /**
   * Polyline stroke width in pixels.
   */
  width?: number;
  /**
   * Array of objects of type PatternItem, specifying the pattern of the polyline's edge line (optional).
   *
   * * Unprovided will imply a solid line.
   * * Empty array will imply no visible line.
   * * Otherwise line pattern starts with first provided element and repeats.
   *
   * For detailed info see {@link PatternItem}
   */
  pattern?: PatternItem[];
  /**
   * Style of joints between polyline's line segments (optional).
   * * `'bevel'` - beveled joints between line segments
   * * `'miter'` - sharp joints between line segments
   * * `'round'` - rounded joints between line segments
   * @default 'miter'
   */
  jointType?: 'bevel' | 'miter' | 'round';
  /**
   * Style if polyline's line endings (optional).
   * * `'butt'` - line ends are squared off exactly at the end point
   * * `'round'` - line ends are rounded with a center point at the end point
   * * `'square'` - line ends are enlongated by half the stroke width and squared off
   * @default 'butt'
   */
  capType?: 'butt' | 'round' | 'square';
};

/**
 * Internal JSON object for representing polylines in Expo Maps library.
 *
 * See `PolylineProps` for more detail.
 */
export type PolylineObject = PolylineProps & {
  type: 'polyline';
};

/**
 * Represents a polyline on the map.
 */
export class Polyline extends React.Component<PolylineProps> {
  render() {
    return null;
  }
}
