import * as Svg from 'react-native-svg';

import Example from './Example';

function EllipseExample() {
  return (
    <Svg.Svg height="100" width="200">
      <Svg.Ellipse
        cx="50%"
        cy="50%"
        rx="45%"
        ry="40%"
        stroke="purple"
        strokeWidth="2"
        fill="yellow"
      />
    </Svg.Svg>
  );
}
EllipseExample.title = 'Ellipse';

function PileEllipses() {
  return (
    <Svg.Svg height="120" width="200">
      <Svg.Ellipse cx="98" cy="60" rx="90" ry="30" fill="purple" />
      <Svg.Ellipse cx="94" cy="45" rx="80" ry="25" fill="lime" />
      <Svg.Ellipse cx="92" cy="30" rx="70" ry="20" fill="yellow" />
    </Svg.Svg>
  );
}
PileEllipses.title = 'The following example creates three ellipses on top of each other';

function CombinedEllipses() {
  return (
    <Svg.Svg height="100" width="200">
      <Svg.Ellipse cx="100" cy="50" rx="90" ry="30" fill="yellow" />
      <Svg.Ellipse cx="95" cy="50" rx="75" ry="20" fill="white" />
    </Svg.Svg>
  );
}
CombinedEllipses.title = 'The following example combines two ellipses (one yellow and one white)';

const icon = (
  <Svg.Svg height="20" width="20">
    <Svg.Ellipse cx="10" cy="10" rx="8" ry="4" stroke="purple" strokeWidth="1" fill="yellow" />
  </Svg.Svg>
);

const Ellipse: Example = {
  icon,
  samples: [EllipseExample, PileEllipses, CombinedEllipses],
};

export default Ellipse;
