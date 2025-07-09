import * as Svg from 'react-native-svg';

import Example from './Example';

function LineExample() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Line x1="10%" y1="10%" x2="90%" y2="90%" stroke="red" strokeWidth="2" />
    </Svg.Svg>
  );
}
LineExample.title = 'Line';

function LineWithStrokeLinecap() {
  return (
    <Svg.Svg height="100" width="200">
      <Svg.Line
        x1="40"
        y1="10"
        x2="160"
        y2="10"
        stroke="red"
        strokeWidth="10"
        strokeLinecap="round"
      />
      <Svg.Line
        x1="40"
        y1="40"
        x2="160"
        y2="40"
        stroke="red"
        strokeWidth="10"
        strokeLinecap="butt"
      />
      <Svg.Line
        x1="40"
        y1="80"
        x2="160"
        y2="80"
        stroke="red"
        strokeWidth="10"
        strokeLinecap="square"
      />
    </Svg.Svg>
  );
}
LineWithStrokeLinecap.title = 'Line';

const icon = (
  <Svg.Svg height="20" width="20">
    <Svg.Line x1="0" y1="0" x2="20" y2="20" stroke="red" strokeWidth="1" />
  </Svg.Svg>
);

const Line: Example = {
  icon,
  samples: [LineExample, LineWithStrokeLinecap],
};

export default Line;
