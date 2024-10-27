import { View } from 'react-native';
import * as Svg from 'react-native-svg';

import Example from './Example';

const { Defs, LinearGradient, RadialGradient, Stop, Ellipse, Circle, Text, Rect, G } = Svg;

function LinearGradientHorizontal() {
  return (
    <Svg.Svg height="150" width="300">
      <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" />
      <Defs>
        <LinearGradient id="grad" x1="65" y1="0" x2="235" y2="0" gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="rgb(255,255,0)" stopOpacity="0" />
          <Stop offset="1" stopColor="red" />
        </LinearGradient>
      </Defs>
    </Svg.Svg>
  );
}
LinearGradientHorizontal.title =
  'Define an ellipse with a horizontal linear gradient from yellow to red';

function LinearGradientRotated() {
  return (
    <Svg.Svg height="150" width="300">
      <Defs>
        <LinearGradient id="grad" x1={0} y1={0} x2="0%" y2="100%">
          <Stop offset="0%" stopColor="rgb(255,255,0)" stopOpacity="0" />
          <Stop offset="100%" stopColor="red" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <G>
        <G>
          <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" />
        </G>
      </G>
    </Svg.Svg>
  );
}
LinearGradientRotated.title = 'Define an ellipse with a rotated linear gradient from yellow to red';

function GradientUnits() {
  return (
    <View style={{ width: 300, height: 150, flexDirection: 'row', justifyContent: 'space-around' }}>
      <Svg.Svg height="150" width="90">
        <Defs>
          <LinearGradient id="defaultUnits" x1="0%" y1="0%" x2="0%" y2="100%">
            <Stop offset="0%" stopColor="#000" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ff0" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#defaultUnits)" x="10" y="10" width="70" height="70" rx="10" ry="10" />
      </Svg.Svg>
      <Svg.Svg height="150" width="90">
        <Defs>
          <LinearGradient
            id="userSpaceOnUse"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse">
            <Stop offset="0%" stopColor="#000" stopOpacity="1" />
            <Stop offset="100%" stopColor="#ff0" stopOpacity="1" />
          </LinearGradient>
        </Defs>
        <Rect fill="url(#userSpaceOnUse)" x="10" y="10" width="70" height="70" rx="10" ry="10" />
      </Svg.Svg>
    </View>
  );
}
GradientUnits.title = 'Compare gradientUnits="userSpaceOnUse" width default';

function LinearGradientPercent() {
  return (
    <Svg.Svg height="150" width="300">
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="rgb(255,255,0)" stopOpacity="0" />
          <Stop offset="100%" stopColor="red" stopOpacity="1" />
        </LinearGradient>
      </Defs>
      <Text x="25" y="70" fill="#333">
        x1=0%
      </Text>
      <Text x="235" y="70" fill="#333">
        x2=100%
      </Text>
      <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" />
    </Svg.Svg>
  );
}
LinearGradientPercent.title = 'Define a linear gradient in percent unit';

function RadialGradientExample() {
  return (
    <Svg.Svg height="150" width="300">
      <Defs>
        <RadialGradient
          id="grad"
          cx="150"
          cy="75"
          r="85"
          fx="150"
          fy="75"
          gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor="#ff0" stopOpacity="1" />
          <Stop offset="0.3" stopColor="#000" stopOpacity="1" />
          <Stop offset="0.7" stopColor="#0f0" stopOpacity="1" />
          <Stop offset="1" stopColor="#83a" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" />
    </Svg.Svg>
  );
}
RadialGradientExample.title = 'Define an ellipse with a radial gradient from yellow to purple';

function RadialGradientPercent() {
  return (
    <Svg.Svg height="150" width="300">
      <Defs>
        <RadialGradient id="grad" cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <Stop offset="100%" stopColor="#00f" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" />
    </Svg.Svg>
  );
}
RadialGradientPercent.title = 'Define a radial gradient in percent unit';

function RadialGradientPart() {
  return (
    <Svg.Svg height="150" width="300">
      <Defs>
        <RadialGradient id="grad" cx="20%" cy="30%" r="30%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor="#fff" stopOpacity="0" />
          <Stop offset="100%" stopColor="#00f" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" />
    </Svg.Svg>
  );
}
RadialGradientPart.title = 'Define another ellipse with a radial gradient from white to blue';

function FillGradientWithOpacity() {
  return (
    <Svg.Svg height="150" width="300">
      <Defs>
        <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <Stop offset="100%" stopColor="#00f" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Ellipse cx="150" cy="75" rx="85" ry="55" fill="url(#grad)" fillOpacity="0.2" />
    </Svg.Svg>
  );
}
FillGradientWithOpacity.title = 'Fill a radial gradient with fillOpacity prop';

function FillGradientInRect() {
  return (
    <Svg.Svg height="150" width="300">
      <Defs>
        <RadialGradient id="grad" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <Stop offset="100%" stopColor="#00f" stopOpacity="1" />
        </RadialGradient>
      </Defs>
      <Rect x="5" y="5" width="290" height="130" fill="url(#grad)" stroke="pink" strokeWidth="5" />
    </Svg.Svg>
  );
}
FillGradientInRect.title = 'Fill a radial gradient inside a rect and stroke it';

const icon = (
  <Svg.Svg height="20" width="20">
    <Defs>
      <LinearGradient id="grad" x1="0" y1="0" x2="0" y2="20">
        <Stop offset="0%" stopColor="rgb(255,255,0)" stopOpacity="0" />
        <Stop offset="100%" stopColor="red" stopOpacity="1" />
      </LinearGradient>
    </Defs>
    <Circle cx="10" cy="10" r="10" fill="url(#grad)" />
  </Svg.Svg>
);

const Gradients: Example = {
  icon,
  samples: [
    LinearGradientHorizontal,
    LinearGradientRotated,
    GradientUnits,
    LinearGradientPercent,
    RadialGradientExample,
    RadialGradientPercent,
    RadialGradientPart,
    FillGradientWithOpacity,
    FillGradientInRect,
  ],
};

export default Gradients;
