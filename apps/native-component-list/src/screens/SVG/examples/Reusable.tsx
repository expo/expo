import * as Svg from 'react-native-svg';

import Example from './Example';

const { Defs, G, Path, Use, Symbol, Circle, ClipPath, LinearGradient, RadialGradient, Stop, Rect } =
  Svg;

function UseExample() {
  return (
    <Svg.Svg height="100" width="300">
      <Defs>
        <G id="shape">
          <G>
            <Circle cx="50" cy="50" r="50" />
            <Rect x="50" y="50" width="50" height="50" />
            <Circle cx="50" cy="50" r="5" fill="blue" />
          </G>
        </G>
      </Defs>
      <Use href="#shape" x="20" y="0" />
      <Use href="#shape" x="170" y="0" />
    </Svg.Svg>
  );
}
UseExample.title = 'Reuse svg code';

function UseShapes() {
  return (
    <Svg.Svg height="110" width="200">
      <G id="shape">
        <Rect x="0" y="0" width="50" height="50" />
      </G>
      <Use href="#shape" x="75" y="50" fill="#0f0" />
      <Use href="#shape" x="110" y="0" stroke="#0ff" fill="#8a3" rotation="45" origin="25, 25" />
      <Use href="#shape" x="150" y="50" stroke="#0f0" strokeWidth="1" fill="none" />
    </Svg.Svg>
  );
}
UseShapes.title = 'Using Shapes Outside of a Defs Element';

function DefsExample() {
  return (
    <Svg.Svg height="100" width="100">
      <Defs>
        <G id="path" x="5" y="2" opacity="0.9">
          <Path
            id="test"
            d="M38.459,1.66A0.884,0.884,0,0,1,39,2.5a0.7,0.7,0,0,1-.3.575L23.235,16.092,27.58,26.1a1.4,1.4,0,0,1,.148.3,1.3,1.3,0,0,1,0,.377,1.266,1.266,0,0,1-2.078.991L15.526,20.6l-7.58,4.35a1.255,1.255,0,0,1-.485,0,1.267,1.267,0,0,1-1.277-1.258q0-.01,0-0.02a1.429,1.429,0,0,1,0-.446C7.243,20.253,8.6,16.369,8.6,16.29L3.433,13.545A0.743,0.743,0,0,1,2.9,12.822a0.822,0.822,0,0,1,.623-0.773l8.164-2.972,3.018-8.5A0.822,0.822,0,0,1,15.427,0a0.752,0.752,0,0,1,.752.555l2.563,6.936S37.65,1.727,37.792,1.685A1.15,1.15,0,0,1,38.459,1.66Z"
          />
        </G>
        <ClipPath id="clip">
          <Circle r="25%" cx="0%" cy="0%" />
        </ClipPath>
        <LinearGradient id="linear" x1="0%" y1="0%" x2="100%" y2="0%">
          <Stop offset="0%" stopColor="yellow" />
          <Stop offset="50%" stopColor="red" />
          <Stop offset="100%" stopColor="blue" />
        </LinearGradient>
        <RadialGradient id="radial" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
          <Stop offset="0%" stopColor="yellow" />
          <Stop offset="50%" stopColor="red" />
          <Stop offset="100%" stopColor="blue" />
        </RadialGradient>
      </Defs>
      <Use href="#path" x="0" fill="blue" opacity="0.6" />
      <Use href="#path" x="20" y="5" fill="url(#linear)" />
      <Use href="#path" clipPath="url(#clip)" fillOpacity="0.6" stroke="#000" strokeWidth="1" />
      <Use href="#path" x="-10" y="20" fill="url(#radial)" />
    </Svg.Svg>
  );
}

DefsExample.title = 'Basic Defs usage';

function SymbolExample() {
  return (
    <Svg.Svg height="150" width="110">
      <Symbol id="symbol" viewBox="0 0 150 110">
        <Circle cx="50" cy="50" r="40" strokeWidth="8" stroke="red" fill="red" />
        <Circle cx="90" cy="60" r="40" strokeWidth="8" stroke="green" fill="white" />
      </Symbol>

      <Use href="#symbol" x="0" y="0" width="100" height="50" />
      <Use href="#symbol" x="10" y="50" width="75" height="38" />
      <Use href="#symbol" x="20" y="100" width="50" height="25" />
    </Svg.Svg>
  );
}

SymbolExample.title = 'Symbol example, reuse elements with viewBox prop';

const icon = (
  <Svg.Svg height="20" width="20">
    <Defs>
      <G id="path" scale="0.5">
        <Path d="M38.459,1.66A0.884,0.884,0,0,1,39,2.5a0.7,0.7,0,0,1-.3.575L23.235,16.092,27.58,26.1a1.4,1.4,0,0,1,.148.3,1.3,1.3,0,0,1,0,.377,1.266,1.266,0,0,1-2.078.991L15.526,20.6l-7.58,4.35a1.255,1.255,0,0,1-.485,0,1.267,1.267,0,0,1-1.277-1.258q0-.01,0-0.02a1.429,1.429,0,0,1,0-.446C7.243,20.253,8.6,16.369,8.6,16.29L3.433,13.545A0.743,0.743,0,0,1,2.9,12.822a0.822,0.822,0,0,1,.623-0.773l8.164-2.972,3.018-8.5A0.822,0.822,0,0,1,15.427,0a0.752,0.752,0,0,1,.752.555l2.563,6.936S37.65,1.727,37.792,1.685A1.15,1.15,0,0,1,38.459,1.66Z" />
      </G>
      <ClipPath id="clip">
        <Circle r="50%" cx="0%" cy="0%" />
      </ClipPath>
    </Defs>
    <Use href="#path" fill="#3a8" />
    <Use
      href="#path"
      fill="red"
      clipPath="url(#clip)"
      fillOpacity="0.6"
      stroke="#000"
      strokeWidth="1"
    />
  </Svg.Svg>
);

const Reusable: Example = {
  icon,
  samples: [UseExample, UseShapes, DefsExample, SymbolExample],
};

export default Reusable;
