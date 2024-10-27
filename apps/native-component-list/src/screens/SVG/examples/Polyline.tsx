import * as Svg from 'react-native-svg';

import Example from './Example';

function PolylineExample() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Polyline
        points="10 10 20 12 30 20 40 60 60 70 95 90"
        fill="none"
        stroke="black"
        strokeWidth="3"
      />
    </Svg.Svg>
  );
}
PolylineExample.title =
  'The <Polyline> element is used to create any shape that consists of only straight lines';

function StraightLines() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Polyline
        points="0,20 20,20 20,40 40,40 40,60 60,60 60,80"
        fill="none"
        stroke="red"
        strokeWidth="2"
      />
    </Svg.Svg>
  );
}
StraightLines.title = 'Another example with only straight lines';

function PolylineFill() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Polyline
        points="10,10 20,12 30,20 40,60 60,70 95,90"
        fill="red"
        stroke="black"
        strokeWidth="3"
      />
    </Svg.Svg>
  );
}
PolylineFill.title = 'Fill Polyline';

function PolylineFillStroke() {
  return (
    <Svg.Svg height="100" width="100">
      <Svg.Polyline
        points="10,10 30,10 30,60 60,70 95,90"
        fill="none"
        stroke="blue"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg.Svg>
  );
}
PolylineFillStroke.title = 'Stroke Polyline with strokeLinecap and strokeLinejoin';

const icon = (
  <Svg.Svg height="20" width="20">
    <Svg.Polyline
      points="2,2 4,2.5 6,4 8,12 12,14 20,18"
      fill="none"
      stroke="black"
      strokeWidth="1"
    />
  </Svg.Svg>
);

const Polyline: Example = {
  icon,
  samples: [PolylineExample, StraightLines, PolylineFill, PolylineFillStroke],
};

export default Polyline;
