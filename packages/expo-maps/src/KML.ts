import React from 'react';

/**
 * KML specific props.
 */
export type KMLProps = {
  /**
   * The value of require('path/to/file.kml') for the .kml asset
   */
  filePath: string;
};

/**
 * Internal JSON object for representing marker KMLs in Expo Maps library.
 *
 * See {@link KMLProps} for more detail.
 */
export type KMLObject = {
  type: 'kml';
} & KMLProps;

/**
 * KML component of Expo Maps library.
 *
 * Displays data provided in .kml file.
 * This component should be ExpoMap component child to work properly.
 *
 * See {@link KMLProps} for more details.
 */
export class KML extends React.Component<KMLProps> {
  render() {
    return null;
  }
}
