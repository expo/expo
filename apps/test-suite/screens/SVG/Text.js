import { Svg } from 'expo';
import React, { Component } from 'react';

const { Text, LinearGradient, Stop, Defs, Path, G, TSpan, TextPath } = Svg;

class TextFill extends Component {
  static title = 'Fill the text with LinearGradient';
  render() {
    return (
      <Svg height="60" width="200">
        <Defs>
          <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <Stop offset="0%" stopColor="rgb(255,255,0)" stopOpacity="0.5" />
            <Stop offset="100%" stopColor="red" stopOpacity="1" />
          </LinearGradient>
        </Defs>

        <Text
          fill="url(#grad)"
          stroke="purple"
          strokeWidth="1"
          fontSize="30"
          fontWeight="bold"
          fontStyle="italic"
          x="100"
          y="40"
          textAnchor="middle">
          FILL TEXT
        </Text>
      </Svg>
    );
  }
}

class TextPathExample extends Component {
  static title = 'Draw text along path';

  render() {
    const path = `
                    M 10 20
                     C 40 10 60  0 80 10
                     C 100 20 120 30 140 20
                     C 160 10 180 10 180 10
                `;

    return (
      <Svg height="100" width="200">
        <Defs>
          <Path id="path" d={path} />
        </Defs>
        <G y="20">
          <Text fill="blue">
            <TextPath href="#path" startOffset="-10%">
              We go up and down,
              <TSpan fill="red" dy="5,5,5">
                then up again
              </TSpan>
            </TextPath>
          </Text>
          <Path d={path} fill="none" stroke="red" strokeWidth="1" />
        </G>
      </Svg>
    );
  }
}

class TSpanExample extends Component {
  static title = 'TSpan nest';

  render() {
    return (
      <Svg height="160" width="200">
        <Text y="20" dx="5 5">
          <TSpan x="10">tspan line 1</TSpan>
          <TSpan x="10" dy="15">
            tspan line 2
          </TSpan>
          <TSpan x="10" dx="10" dy="15">
            tspan line 3
          </TSpan>
        </Text>
        <Text x="10" y="60" fill="red" fontSize="14">
          <TSpan dy="5 10 20">12345</TSpan>
          <TSpan fill="blue" dy="15" dx="0 5 5">
            <TSpan>6</TSpan>
            <TSpan>7</TSpan>
          </TSpan>
          <TSpan dx="0 10 20" dy="0 20" fontWeight="bold" fontSize="12">
            89a
          </TSpan>
        </Text>
        <Text y="140" dx="0 5 5" dy="0 -5 -5">
          delta on text
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

const samples = [TextFill, TextPathExample, TSpanExample];

export { icon, samples };
