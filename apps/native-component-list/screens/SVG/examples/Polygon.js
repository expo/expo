import React, { Component } from 'react';

import Svg, { Polygon, G, Path } from 'react-native-svg';

class PolygonExample extends Component {
  static title = 'The following example creates a polygon with three sides';

  render() {
    return (
      <Svg height="100" width="100">
        <Polygon points="40,5 70,80 25,95" fill="lime" stroke="purple" strokeWidth="1" />
      </Svg>
    );
  }
}

class FourSidePolygon extends Component {
  static title = 'The following example creates a polygon with four sides';
  render() {
    return (
      <Svg height="100" width="100">
        <Polygon points="70 5 90  75 45 90 25 80" fill="lime" stroke="purple" strokeWidth="1" />
      </Svg>
    );
  }
}

class StarPolygon extends Component {
  static title = 'Use the <Polygon /> element to create a star';
  render() {
    return (
      <Svg height="105" width="105">
        <G scale="0.5">
          <Polygon
            points="100,10 40,198 190,78 10,78 160,198"
            fill="lime"
            stroke="purple"
            strokeWidth="5"
          />
        </G>
      </Svg>
    );
  }
}

class EvenOddPolygon extends Component {
  static title = 'Change the fill-rule property to "evenodd"';
  render() {
    return (
      <Svg height="105" width="105">
        <G scale="0.5" fillRule="evenodd">
          <Polygon
            points="100,10 40,198 190,78 10,78 160,198"
            fill="lime"
            stroke="purple"
            strokeWidth="5"
          />
        </G>
      </Svg>
    );
  }
}

const icon = (
  <Svg height="20" width="20">
    <G scale="0.1">
      <Polygon
        points="100,10 40,198 190,78 10,78 160,198"
        fill="lime"
        stroke="purple"
        strokeWidth="10"
      />
    </G>
  </Svg>
);

const samples = [PolygonExample, FourSidePolygon, StarPolygon, EvenOddPolygon];

export { icon, samples };
