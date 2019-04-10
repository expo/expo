import { Svg } from 'expo';
import React, { Component } from 'react';

const { Text, LinearGradient, Stop, Defs, Path, G, TSpan, TextPath } = Svg;

class TextExample extends Component {
  static title = 'Text';

  render() {
    return (
      <Svg height="30" width="100">
        <Text x="50" y="9" fill="red" textAnchor="middle">
          I love SVG!
        </Text>
      </Svg>
    );
  }
}

class TextRotate extends Component {
  static title = 'Transform the text';

  render() {
    return (
      <Svg height="60" width="200">
        <Text x="0" y="15" fill="red" rotate="30" origin="20,40">
          I love SVG
        </Text>
        <Text x="95" y="47" fill="blue" rotate="-25" origin="95, 20">
          I love SVG
        </Text>
        <Text x="126" y="5" fill="#f60" rotate="106" scale="1.36" origin="140, 0">
          I love SVG
        </Text>
      </Svg>
    );
  }
}

class TextStroke extends Component {
  static title = 'Stroke the text';
  render() {
    return (
      <Svg height="60" width="200">
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="100%" stopColor="red" stopOpacity="0" />
            <Stop offset="0%" stopColor="blue" stopOpacity="0.5" />
          </LinearGradient>
        </Defs>
        <Text
          stroke="url(#grad)"
          strokeWidth="2"
          fill="none"
          fontSize="30"
          fontWeight="bold"
          x="100"
          y="40">
          <TSpan textAnchor="middle">{['STROKE TEXT']}</TSpan>
        </Text>
      </Svg>
    );
  }
}

const icon = (
  <Svg height="20" width="20">
    <Text
      x="10"
      y="15"
      fontSize="14"
      fontWeight="bold"
      fontFamily="PingFang HK"
      textAnchor="middle"
      fill="none"
      stroke="blue"
      strokeWidth="1">
      字
    </Text>
  </Svg>
);

const samples = [TextExample, TextRotate, TextStroke];

export { icon, samples };
