import React from 'react';
import { Color, PatternItem } from './Common.types';
/**
 * GeoJson specific props.
 */
export type GeoJsonProps = {
    /**
     * JSON string containing GeoJSON
     */
    geoJsonString: string;
    /**
     * Default style for different GeoJSON feature types
     */
    defaultStyle?: {
        /**
         * Default style for `Polygon` GeoJSON feature
         */
        polygon?: {
            /**
             * See {@link PolygonProps}
             */
            fillColor?: string | Color;
            /**
             * See {@link PolygonProps}
             */
            strokeColor?: string | Color;
            /**
             * See {@link PolygonProps}
             */
            strokeWidth?: number;
            /**
             * See {@link PolygonProps}
             * Works only on `Android`.
             */
            strokeJointType?: 'bevel' | 'miter' | 'round';
            /**
             * See {@link PolygonProps}
             * Works only on `Android`.
             */
            strokePattern?: PatternItem[];
        };
        /**
         * Default style for `LineString` GeoJSON feature
         */
        polyline?: {
            /**
             * See {@link PolylineProps}
             */
            color?: string | Color;
            /**
             * See {@link PolylineProps}
             * Works only on `Android`.
             */
            pattern?: PatternItem[];
            /**
             * See {@link PolylineProps}
             * Works only on `iOS`.
             */
            width?: number;
        };
        /**
         * Default style for `Point` GeoJSON feature
         * Works only on `Android`.
         */
        marker?: {
            /**
             * See {@link MarkerProps}
             * Works only on `Android`.
             */
            color?: string;
            /**
             * See {@link MarkerProps}
             * Works only on `Android`.
             */
            title?: string;
            /**
             * See {@link MarkerProps}
             * Works only on `Android`.
             */
            snippet?: string;
        };
    };
};
/**
 * Internal JSON object for representing GeoJSON in Expo Maps library.
 *
 * See {@link GeoJsonProps} for more detail.
 */
export type GeoJsonObject = {
    type: 'geojson';
    defaultStyle?: {
        polygon?: {
            fillColor?: string;
            strokeColor?: string;
            strokeWidth?: number;
            strokeJointType?: 'bevel' | 'miter' | 'round';
            strokePattern?: PatternItem[];
        };
        polyline?: {
            color?: string;
            pattern?: PatternItem[];
        };
        marker?: {
            color?: number;
            title?: string;
            snippet?: string;
        };
    };
} & Omit<GeoJsonProps, 'defaultStyle'>;
/**
 * GeoJSON component of Expo Maps library.
 *
 * Displays data provided in .json file.
 * This component should be ExpoMap component child to work properly.
 *
 * See {@link GeoJsonProps} for more details.
 *
 * On Android you can style your features individually by specifing supported properties for given feature type:
 *
 * For polygon you can use:
 * * fillColor
 * * strokeColor
 * * strokeWidth
 * * strokeJointType
 * * strokePattern
 * props. Please check documentation for these five here {@link PolygonProps}.
 *
 * For polyline you can use:
 * * color
 * * pattern
 * props. Please check documentation for these two here {@link PolylineProps}.
 *
 * For marker you can use:
 * * color
 * * title
 * * snippet
 * props. Please check documentation for these three here {@link MarkerProps}.
 *
 * @example
 * {
    "type": "FeatureCollection",
    "features": [
      {
        "type": "Feature",
        "geometry": { "type": "Point", "coordinates": [102.0, 0.5] },
        "properties": {
          "color": "blue",
          "title": "Marker",
          "snippet": "This is marker from GeoJSON"
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "LineString",
          "coordinates": [
            [1.75, 47.69],
            [21.89, 42.79],
            [43.65, 53.22],
            [58.58, 48.58]
          ]
        },
        "properties": {
          "color": "magenta",
          "pattern": [
            { "type": "stroke", "length": 10 },
            { "type": "stroke", "length": 0 },
            { "type": "stroke", "length": 10 },
            { "type": "gap", "length": 10 },
            { "type": "stroke", "length": 0 },
            { "type": "gap", "length": 10 }
          ]
        }
      },
      {
        "type": "Feature",
        "geometry": {
          "type": "Polygon",
          "coordinates": [
            [
              [15.73, 53.84],
              [16.31, 51.11],
              [50.14, 22.07],
              [53.18, 22.11]
            ]
          ]
        },
        "properties": {
          "fillColor": "blue",
          "strokeColor": "#000000",
          "strokeWidth": 10,
          "strokeJointType": "bevel",
          "strokePattern": [
            { "type": "stroke", "length": 10 },
            { "type": "stroke", "length": 0 },
            { "type": "stroke", "length": 10 },
            { "type": "gap", "length": 10 },
            { "type": "stroke", "length": 0 },
            { "type": "gap", "length": 10 }
          ]
        }
      }
    ]
  }
 */
export declare class GeoJson extends React.Component<GeoJsonProps> {
    render(): null;
}
//# sourceMappingURL=GeoJson.d.ts.map