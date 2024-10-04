import React from 'react';
import * as Svg from 'react-native-svg';

import Example from './Example';

const { G } = Svg;

class PolygonExample extends React.Component {
  static title = 'The following example creates a polygon with three sides';

  render() {
    return (
      <Svg.Svg height="100" width="100">
        <Svg.Polygon points="40,5 70,80 25,95" fill="lime" stroke="purple" strokeWidth="1" />
      </Svg.Svg>
    );
  }
}

class FourSidePolygon extends React.Component {
  static title = 'The following example creates a polygon with four sides';
  render() {
    return (
      <Svg.Svg height="100" width="100">
        <Svg.Polygon points="70 5 90  75 45 90 25 80" fill="lime" stroke="purple" strokeWidth="1" />
      </Svg.Svg>
    );
  }
}

class StarPolygon extends React.Component {
  static title = 'Use the <Polygon /> element to create a star';
  render() {
    return (
      <Svg.Svg height="105" width="105">
        <G scale="0.5">
          <Svg.Polygon
            points="100,10 40,198 190,78 10,78 160,198"
            fill="lime"
            stroke="purple"
            strokeWidth="5"
          />
        </G>
      </Svg.Svg>
    );
  }
}

class EvenOddPolygon extends React.Component {
  static title = 'Change the fill-rule property to "evenodd"';
  render() {
    return (
      <Svg.Svg height="105" width="105">
        <G scale="0.5" fillRule="evenodd">
          <Svg.Polygon
            points="100,10 40,198 190,78 10,78 160,198"
            fill="lime"
            stroke="purple"
            strokeWidth="5"
          />
        </G>
      </Svg.Svg>
    );
  }
}

const icon = (
  <Svg.Svg height="20" width="20">
    <G scale="0.1">
      <Svg.Polygon
        points="100,10 40,198 190,78 10,78 160,198"
        fill="lime"
        stroke="purple"
        strokeWidth="10"
      />
    </G>
  </Svg.Svg>
);

const Polygon: Example = {
  icon,
  samples: [PolygonExample, FourSidePolygon, StarPolygon, EvenOddPolygon],
};

export default Polygon;
