import React from 'react';
import * as Svg from 'react-native-svg';

import Example from './Example';

const { Circle, Line, Rect, Text, Use } = Svg;

interface State {
  fill: string;
}

// See: https://github.com/expo/expo/pull/10229#discussion_r490961694
// eslint-disable-next-line @typescript-eslint/ban-types
class GExample extends React.Component<{}, State> {
  static title = 'G children props inherit';

  readonly state: State = {
    fill: 'purple',
  };

  _unmounted?: boolean;

  componentDidMount = () => {
    setTimeout(() => {
      if (!this._unmounted) {
        this.setState({
          fill: '#856',
        });
      }
    }, 2000);
  };

  componentWillUnmount = () => {
    this._unmounted = true;
  };

  render() {
    return (
      <Svg.Svg height="100" width="100">
        <Svg.G fill={this.state.fill} stroke="pink" strokeWidth="3">
          <Svg.G>
            <Circle cx="25" cy="25" r="11" />
          </Svg.G>
          <Circle cx="25" cy="75" r="11" stroke="red" />
          <Circle cx="50" cy="50" r="11" fill="green" />
          <Circle cx="75" cy="25" r="11" stroke="red" />
          <Circle cx="75" cy="75" r="11" />
        </Svg.G>
      </Svg.Svg>
    );
  }
}

class GTransform extends React.Component {
  static title = 'G transform';
  render() {
    return (
      <Svg.Svg height="100" width="200">
        <Svg.G rotation="50" origin="40, 30" id="group">
          <Line x1="60" y1="10" x2="140" y2="10" stroke="#060" strokeWidth="1" />

          <Rect x="60" y="20" height="50" width="80" stroke="#060" strokeWidth="1" fill="#060" />

          <Text x="100" y="75" stroke="#600" strokeWidth="1" fill="#600" textAnchor="middle">
            Text grouped with shapes
          </Text>
        </Svg.G>
        <Use
          href="#group"
          x="5"
          y="40"
          transform="rotate(-50)"
          scale="0.75"
          stroke="red"
          opacity="0.5"
        />
      </Svg.Svg>
    );
  }
}

const icon = (
  <Svg.Svg height="20" width="20">
    <Svg.G fill="purple" stroke="pink" strokeWidth="1">
      <Circle cx="5" cy="5" r="3" />
      <Circle cx="5" cy="15" r="3" />
      <Circle cx="10" cy="10" fill="green" r="3" />
      <Circle cx="15" cy="5" r="3" />
      <Circle cx="15" cy="15" r="3" />
    </Svg.G>
  </Svg.Svg>
);

const G: Example = {
  icon,
  samples: [GExample, GTransform],
};

export default G;
