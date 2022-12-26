import React from 'react';
import * as Svg from 'react-native-svg';

import Example from './Example';

class EllipseExample extends React.Component {
  static title = 'Ellipse';
  render() {
    return (
      <Svg.Svg height="100" width="200">
        <Svg.Ellipse
          cx="50%"
          cy="50%"
          rx="45%"
          ry="40%"
          stroke="purple"
          strokeWidth="2"
          fill="yellow"
        />
      </Svg.Svg>
    );
  }
}

class PileEllipses extends React.Component {
  static title = 'The following example creates three ellipses on top of each other';
  render() {
    return (
      <Svg.Svg height="120" width="200">
        <Svg.Ellipse cx="98" cy="60" rx="90" ry="30" fill="purple" />
        <Svg.Ellipse cx="94" cy="45" rx="80" ry="25" fill="lime" />
        <Svg.Ellipse cx="92" cy="30" rx="70" ry="20" fill="yellow" />
      </Svg.Svg>
    );
  }
}

class CombinedEllipses extends React.Component {
  static title = 'The following example combines two ellipses (one yellow and one white)';
  render() {
    return (
      <Svg.Svg height="100" width="200">
        <Svg.Ellipse cx="100" cy="50" rx="90" ry="30" fill="yellow" />
        <Svg.Ellipse cx="95" cy="50" rx="75" ry="20" fill="white" />
      </Svg.Svg>
    );
  }
}

const icon = (
  <Svg.Svg height="20" width="20">
    <Svg.Ellipse cx="10" cy="10" rx="8" ry="4" stroke="purple" strokeWidth="1" fill="yellow" />
  </Svg.Svg>
);

const Ellipse: Example = {
  icon,
  samples: [EllipseExample, PileEllipses, CombinedEllipses],
};

export default Ellipse;
