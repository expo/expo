import React, { Component } from 'react';

import Svg, { Polyline } from 'react-native-svg';

class PolylineExample extends Component {
  static title =
    'The <Polyline> element is used to create any shape that consists of only straight lines';
  render() {
    return (
      <Svg height="100" width="100">
        <Polyline
          points="10 10 20 12 30 20 40 60 60 70 95 90"
          fill="none"
          stroke="black"
          strokeWidth="3"
        />
      </Svg>
    );
  }
}

class StraightLines extends Component {
  static title = 'Another example with only straight lines';
  render() {
    return (
      <Svg height="100" width="100">
        <Polyline
          points="0,20 20,20 20,40 40,40 40,60 60,60 60,80"
          fill="none"
          stroke="red"
          strokeWidth="2"
        />
      </Svg>
    );
  }
}

class PolylineFill extends Component {
  static title = 'Fill Polyline';
  render() {
    return (
      <Svg height="100" width="100">
        <Polyline
          points="10,10 20,12 30,20 40,60 60,70 95,90"
          fill="red"
          stroke="black"
          strokeWidth="3"
        />
      </Svg>
    );
  }
}

class PolylineFillStroke extends Component {
  static title = 'Stroke Polyline with strokeLinecap and strokeLinejoin';
  render() {
    return (
      <Svg height="100" width="100">
        <Polyline
          points="10,10 30,10 30,60 60,70 95,90"
          fill="none"
          stroke="blue"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    );
  }
}

const icon = (
  <Svg height="20" width="20">
    <Polyline points="2,2 4,2.5 6,4 8,12 12,14 20,18" fill="none" stroke="black" strokeWidth="1" />
  </Svg>
);

const samples = [PolylineExample, StraightLines, PolylineFill, PolylineFillStroke];

export { icon, samples };
