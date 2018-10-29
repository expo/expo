import React, { Component } from 'react';

import Svg, { Ellipse } from 'react-native-svg';

class EllipseExample extends Component {
  static title = 'Ellipse';
  render() {
    return (
      <Svg height="100" width="200">
        <Ellipse
          cx="50%"
          cy="50%"
          rx="45%"
          ry="40%"
          stroke="purple"
          strokeWidth="2"
          fill="yellow"
        />
      </Svg>
    );
  }
}

class PileEllipses extends Component {
  static title = 'The following example creates three ellipses on top of each other';
  render() {
    return (
      <Svg height="120" width="200">
        <Ellipse cx="98" cy="60" rx="90" ry="30" fill="purple" />
        <Ellipse cx="94" cy="45" rx="80" ry="25" fill="lime" />
        <Ellipse cx="92" cy="30" rx="70" ry="20" fill="yellow" />
      </Svg>
    );
  }
}

class CombinedEllipses extends Component {
  static title = 'The following example combines two ellipses (one yellow and one white)';
  render() {
    return (
      <Svg height="100" width="200">
        <Ellipse cx="100" cy="50" rx="90" ry="30" fill="yellow" />
        <Ellipse cx="95" cy="50" rx="75" ry="20" fill="white" />
      </Svg>
    );
  }
}

const icon = (
  <Svg height="20" width="20">
    <Ellipse cx="10" cy="10" rx="8" ry="4" stroke="purple" strokeWidth="1" fill="yellow" />
  </Svg>
);

const samples = [EllipseExample, PileEllipses, CombinedEllipses];

export { icon, samples };
