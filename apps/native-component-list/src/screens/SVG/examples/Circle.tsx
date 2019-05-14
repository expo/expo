// tslint:disable max-classes-per-file
import React from 'react';
import * as Svg from 'react-native-svg';
import Example from './Example';

class CircleExample extends React.Component {
  static title = 'Circle';
  render() {
    return (
      <Svg height="100" width="140">
        <Svg.Circle cx="50%" cy="50%" r="40%" fill="pink" />
      </Svg>
    );
  }
}

class StrokeCircle extends React.Component {
  static title = 'Stroke Circle';
  render() {
    return (
      <Svg height="100" width="100">
        <Svg.Circle cx="50" cy="50" r="45" stroke="purple" strokeWidth="2.5" fill="none" />
      </Svg>
    );
  }
}

class StrokeOpacityCircle extends React.Component {
  static title = 'Circle with strokeOpacity';
  render() {
    return (
      <Svg height="100" width="100">
        <Svg.Circle
          cx="50"
          cy="50"
          r="40"
          stroke="purple"
          strokeOpacity="0.5"
          strokeWidth="10"
          fill="pink"
        />
      </Svg>
    );
  }
}

class PieCircle extends React.Component {
  static title = 'Draw a Pie shape with circle';
  render() {
    return (
      <Svg height="100" width="100">
        <Svg.Circle cx="50" cy="50" r="40" fill="#ddd" />
        <Svg.Circle
          origin="50, 50"
          rotate="-90"
          cx="50"
          cy="50"
          r="20"
          stroke="#0074d9"
          strokeWidth="40"
          fill="none"
          strokeDasharray="80, 160"
        />
      </Svg>
    );
  }
}

const icon = (
  <Svg height="20" width="20">
    <Svg.Circle cx="10" cy="10" r="8" stroke="purple" strokeWidth="1" fill="pink" />
  </Svg>
);

const Circle: Example = {
  icon,
  samples: [CircleExample, StrokeCircle, StrokeOpacityCircle, PieCircle],
};

export default Circle;
