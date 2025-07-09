import * as Svg from 'react-native-svg';

import Example from './Example';

const { Path, Rect, G, Defs, Stop, RadialGradient, Polyline, ClipPath, Circle, Text } = Svg;

function StrokeExample() {
  return (
    <Svg.Svg height="80" width="225">
      <G strokeWidth="1">
        <Path stroke="red" d="M5 20 l215 0" />
        <Path stroke="black" d="M5 40 l215 0" />
        <Path stroke="blue" d="M5 60 l215 0" />
      </G>
    </Svg.Svg>
  );
}
StrokeExample.title =
  'The stroke property defines the color of a line, text or outline of an element';

function StrokeLinecap() {
  return (
    <Svg.Svg height="80" width="225">
      <G stroke="red">
        <G strokeWidth="8">
          <Path strokeLinecap="butt" d="M5 20 l215 0" />
          <Path strokeLinecap="round" d="M5 40 l215 0" />
          <Path strokeLinecap="square" d="M5 60 l215 0" />
        </G>
      </G>
    </Svg.Svg>
  );
}
StrokeLinecap.title =
  'The strokeLinecap property defines different types of endings to an open path';

function StrokeDasharray() {
  return (
    <Svg.Svg height="80" width="225">
      <G fill="none" stroke="black" strokeWidth="4">
        <Path strokeDasharray="5,5" d="M5 20 l215 0" />
        <Path strokeDasharray="10,10" d="M5 40 l215 0" />
        <Path strokeDasharray="20,10,5,5,5,10" d="M5 60 l215 0" />
      </G>
    </Svg.Svg>
  );
}
StrokeDasharray.title = 'strokeDasharray';

function StrokeDashoffset() {
  return (
    <Svg.Svg height="80" width="200">
      <Circle
        cx="100"
        cy="40"
        r="35"
        strokeWidth="5"
        stroke="red"
        fill="none"
        strokeDasharray="100"
        strokeDashoffset="100"
      />
      <Text
        stroke="blue"
        strokeWidth="1"
        fill="none"
        fontSize="20"
        fontWeight="bold"
        x="100"
        y="40"
        textAnchor="middle"
        strokeDasharray="100"
        strokeDashoffset="60">
        STROKE
      </Text>
    </Svg.Svg>
  );
}
StrokeDashoffset.title =
  'the strokeDashoffset attribute specifies the distance into the dash pattern to start the dash.';

function StrokePattern() {
  return (
    <Svg.Svg height="80" width="200">
      <Defs>
        <RadialGradient id="grad" cx="50%" cy="50%" rx="80%" ry="80%" fx="50%" fy="50%">
          <Stop offset="50%" stopColor="#fff" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#f00" stopOpacity="1" />
        </RadialGradient>
        <ClipPath id="clip">
          <Circle r="96" cx="100" cy="40" />
        </ClipPath>
      </Defs>
      <Rect
        x="5"
        y="5"
        height="70"
        width="190"
        fill="blue"
        stroke="url(#grad)"
        strokeWidth="5"
        strokeDasharray="10"
        clipPath="url(#clip)"
      />

      <Polyline
        strokeDasharray="20,10,5,5,5,10"
        points="10,10 20,12 30,20 40,60 60,70 90,55"
        fill="none"
        stroke="url(#grad)"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </Svg.Svg>
  );
}
StrokePattern.title = 'Advanced stroke example.';

const icon = (
  <Svg.Svg height="20" width="20">
    <G fill="none" stroke="black" strokeWidth="2">
      <Path strokeDasharray="2,2" d="M0 4 h20" />
      <Path strokeDasharray="4,4" d="M0 10 h20" />
      <Path strokeDasharray="4,2,1,1,1,6" d="M0 19 h20" />
    </G>
  </Svg.Svg>
);

const Stroking: Example = {
  icon,
  samples: [StrokeExample, StrokeLinecap, StrokeDasharray, StrokeDashoffset, StrokePattern],
};

export default Stroking;
