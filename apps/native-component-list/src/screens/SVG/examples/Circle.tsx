import * as Svg from 'react-native-svg';

import Example from './Example';

function CircleExample() {
  return (
    <Svg.Svg height="100" width="140">
      <Svg.Circle cx="50%" cy="50%" r="40%" fill="pink" />
    </Svg.Svg>
  );
}

CircleExample.title = 'Circle';

function StrokeCircle() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Circle cx="50" cy="50" r="45" stroke="purple" strokeWidth="2.5" fill="none" />
    </Svg.Svg>
  );
}

StrokeCircle.title = 'Stroke Circle';

function StrokeOpacityCircle() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Circle
        cx="50"
        cy="50"
        r="40"
        stroke="purple"
        strokeOpacity="0.5"
        strokeWidth="10"
        fill="pink"
      />
    </Svg.Svg>
  );
}

StrokeOpacityCircle.title = 'Circle with strokeOpacity';

function PieCircle() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Circle cx="50" cy="50" r="40" fill="#ddd" />
      <Svg.Circle
        origin="50, 50"
        rotation="-90"
        cx="50"
        cy="50"
        r="20"
        stroke="#0074d9"
        strokeWidth="40"
        fill="none"
        strokeDasharray="80, 160"
      />
    </Svg.Svg>
  );
}
PieCircle.title = 'Draw a Pie shape with circle';

const icon = (
  <Svg.Svg height="20" width="20">
    <Svg.Circle cx="10" cy="10" r="8" stroke="purple" strokeWidth="1" fill="pink" />
  </Svg.Svg>
);

const Circle: Example = {
  icon,
  samples: [CircleExample, StrokeCircle, StrokeOpacityCircle, PieCircle],
};

export default Circle;
