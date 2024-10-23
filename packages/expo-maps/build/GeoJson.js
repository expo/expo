import React from 'react';
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
export class GeoJson extends React.Component {
    render() {
        return null;
    }
}
//# sourceMappingURL=GeoJson.js.map