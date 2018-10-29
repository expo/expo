import React, { Component } from 'react';

import Svg, { Line } from 'react-native-svg';

class LineExample extends Component {
  static title = 'Line';

  render() {
    return (
      <Svg height="100" width="100">
        <Line x1="10%" y1="10%" x2="90%" y2="90%" stroke="red" strokeWidth="2" />
      </Svg>
    );
  }
}

class LineWithStrokeLinecap extends Component {
  static title = 'Line';

  render() {
    return (
      <Svg height="100" width="200">
        <Line
          x1="40"
          y1="10"
          x2="160"
          y2="10"
          stroke="red"
          strokeWidth="10"
          strokeLinecap="round"
        />
        <Line x1="40" y1="40" x2="160" y2="40" stroke="red" strokeWidth="10" strokeLinecap="butt" />
        <Line
          x1="40"
          y1="80"
          x2="160"
          y2="80"
          stroke="red"
          strokeWidth="10"
          strokeLinecap="square"
        />
      </Svg>
    );
  }
}

const icon = (
  <Svg height="20" width="20">
    <Line x1="0" y1="0" x2="20" y2="20" stroke="red" strokeWidth="1" />
  </Svg>
);

const samples = [LineExample, LineWithStrokeLinecap];

export { icon, samples };
