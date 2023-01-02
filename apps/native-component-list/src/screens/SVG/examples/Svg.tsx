import React from 'react';
import { Image, StyleSheet, View } from 'react-native';
import * as Svg from 'react-native-svg';

import Example from './Example';

const { Circle, Rect, Path, Line, G } = Svg;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    height: 100,
    width: 200,
  },
  svg: {
    flex: 1,
    alignSelf: 'stretch',
  },
});

class SvgExample extends React.Component {
  static title = 'SVG';
  render() {
    return (
      <Svg.Svg height="100" width="100">
        <Circle cx="50" cy="50" r="45" stroke="blue" strokeWidth="2.5" fill="green" />
        <Rect x="15" y="15" width="70" height="70" stroke="red" strokeWidth="2" fill="yellow" />
      </Svg.Svg>
    );
  }
}

class SvgOpacity extends React.Component {
  static title = 'SVG with `opacity` prop';
  render() {
    return (
      <Svg.Svg height="100" width="100" opacity="0.2">
        <Circle cx="50" cy="50" r="45" stroke="blue" strokeWidth="2.5" fill="green" />
        <Rect x="15" y="15" width="70" height="70" stroke="red" strokeWidth="2" fill="yellow" />
      </Svg.Svg>
    );
  }
}

class SvgViewbox extends React.Component {
  static title = 'SVG with `viewBox="40 20 100 40" and preserveAspectRatio="none"`';
  render() {
    return (
      <Svg.Svg height="100" width="100" viewBox="40 20 100 40" preserveAspectRatio="none">
        <G>
          <Rect x="0" y="0" width="100" height="100" fill="red" />
          <Circle cx="50" cy="50" r="30" fill="yellow" />
          <Circle cx="40" cy="40" r="4" fill="black" />
          <Circle cx="60" cy="40" r="4" fill="black" />
          <Path d="M 40 60 A 10 10 0 0 0 60 60" stroke="black" />
        </G>
      </Svg.Svg>
    );
  }
}

class NullComponent extends React.Component {
  render() {
    return null;
  }
}

class SvgLayout extends React.Component {
  static title = 'SVG with flex layout';
  render() {
    return (
      <View style={styles.container}>
        <Svg.Svg style={styles.svg}>
          <G>
            <NullComponent />
          </G>
          <NullComponent />
          <Rect
            width="80%"
            height="80%"
            x="10%"
            y="10%"
            fill="purple"
            stroke="yellow"
            strokeWidth="4"
          />
          <Line x1="10%" y1="10%" x2="90%" y2="90%" stroke="yellow" strokeWidth="4" />
          <Line x1="10%" y1="90%" x2="90%" y2="10%" stroke="yellow" strokeWidth="4" />
        </Svg.Svg>
      </View>
    );
  }
}

class SvgNativeMethods extends React.Component {
  static title = 'Tap the shapes to render the Image below based on the base64-data of the Svg';

  state: { base64?: string } = {};

  root?: any;

  alert = () => {
    this.root.toDataURL((base64: string) => {
      this.setState({
        base64,
      });
    });
  };

  render() {
    return (
      <View>
        <Svg.Svg
          height="100"
          width="150"
          ref={(ele) => {
            this.root = ele;
          }}>
          <G x="40" onPress={this.alert}>
            <Circle cx="32" cy="32" r="4.167" fill="blue" />
            <Path
              d="M55.192 27.87l-5.825-1.092a17.98 17.98 0 0 0-1.392-3.37l3.37-4.928c.312-.456.248-1.142-.143-1.532l-4.155-4.156c-.39-.39-1.076-.454-1.532-.143l-4.928 3.37a18.023 18.023 0 0 0-3.473-1.42l-1.086-5.793c-.103-.543-.632-.983-1.185-.983h-5.877c-.553 0-1.082.44-1.185.983l-1.096 5.85a17.96 17.96 0 0 0-3.334 1.393l-4.866-3.33c-.456-.31-1.142-.247-1.532.144l-4.156 4.156c-.39.39-.454 1.076-.143 1.532l3.35 4.896a18.055 18.055 0 0 0-1.37 3.33L8.807 27.87c-.542.103-.982.632-.982 1.185v5.877c0 .553.44 1.082.982 1.185l5.82 1.09a18.013 18.013 0 0 0 1.4 3.4l-3.31 4.842c-.313.455-.25 1.14.142 1.53l4.155 4.157c.39.39 1.076.454 1.532.143l4.84-3.313c1.04.563 2.146 1.02 3.3 1.375l1.096 5.852c.103.542.632.982 1.185.982h5.877c.553 0 1.082-.44 1.185-.982l1.086-5.796c1.2-.354 2.354-.82 3.438-1.4l4.902 3.353c.456.313 1.142.25 1.532-.142l4.155-4.154c.39-.39.454-1.076.143-1.532l-3.335-4.874a18.016 18.016 0 0 0 1.424-3.44l5.82-1.09c.54-.104.98-.633.98-1.186v-5.877c0-.553-.44-1.082-.982-1.185zM32 42.085c-5.568 0-10.083-4.515-10.083-10.086 0-5.568 4.515-10.084 10.083-10.084 5.57 0 10.086 4.516 10.086 10.083 0 5.57-4.517 10.085-10.086 10.085z"
              fill="blue"
            />
          </G>
        </Svg.Svg>
        <View style={{ width: 150, height: 100, borderWidth: 1, marginTop: 5 }}>
          {this.state.base64 && (
            <Image
              source={{ uri: `data:image/png;base64,${this.state.base64}` }}
              style={{ width: 150, height: 100 }}
            />
          )}
        </View>
      </View>
    );
  }
}

const icon = (
  <Svg.Svg height="20" width="20">
    <Circle cx="10" cy="10" r="8" stroke="blue" strokeWidth="1" fill="green" />
    <Rect x="4" y="4" width="12" height="12" stroke="red" strokeWidth="1" fill="yellow" />
  </Svg.Svg>
);

const SVG: Example = {
  icon,
  samples: [SvgExample, SvgOpacity, SvgViewbox, SvgLayout, SvgNativeMethods],
};

export default SVG;
