import React from 'react';
import * as Svg from 'react-native-svg';

import Example from './Example';

const { Circle, Path, Rect, G, Text, ClipPath, Defs } = Svg;

function PressExample() {
  return (
    <Svg.Svg height="100" width="100">
      <Circle cx="50%" cy="50%" r="38%" fill="red" onPress={() => alert('Press on Circle')} />
      <Rect
        x="20%"
        y="20%"
        width="60%"
        height="60%"
        fill="blue"
        onLongPress={() => alert('Long press on Rect')}
      />
      <Path d="M50,5L20,99L95,39L5,39L80,99z" fill="pink" />
    </Svg.Svg>
  );
}
PressExample.title =
  'Press on the red circle or long press on the blue rectangle to trigger the events';

function HoverExample() {
  const [hover, setHover] = React.useState(false);

  return (
    <Svg.Svg height="120" width="120">
      <Defs>
        <ClipPath id="clip">
          <Circle r="30" cx="50%" cy="50%" />
        </ClipPath>
      </Defs>
      <G>
        <G>
          <Path
            d="M50,5L20,99L95,39L5,39L80,99z"
            clipPath="url(#clip)"
            stroke={hover ? 'rgba(10, 10, 10, 0.5)' : 'black'}
            fill={hover ? 'pink' : 'red'}
            strokeWidth="6"
            delayPressIn={0}
            onPressIn={() => setHover(true)}
            onPressOut={() => setHover(false)}
            x="0"
            y="0"
            scale="1.2"
          />
        </G>
      </G>
    </Svg.Svg>
  );
}
HoverExample.title = 'Hover the svg path';

function GroupExample() {
  return (
    <Svg.Svg height="120" width="120" viewBox="0 0 240 240">
      <G onPress={() => alert('Pressed on G')}>
        <G scale="1.4">
          <G>
            <Circle cx="80" cy="80" r="30" fill="green" x="20" scale="1.2" />
            <Text
              fontWeight="bold"
              fontSize="40"
              x="50"
              y="10"
              scale="2"
              onPress={() => alert('Pressed on Text')}>
              H
            </Text>
            <Rect x="20" y="20" width="40" height="40" fill="yellow" />
          </G>
        </G>
      </G>
    </Svg.Svg>
  );
}

GroupExample.title = 'Bind touch events callback on Group element with viewBox';

const icon = (
  <Svg.Svg height="20" width="20">
    <Circle fill="#ccc" stroke="#000" cx="11.1" cy="4.4" r="2.6" />
    <Path
      fill="#fff"
      stroke="#000"
      strokeWidth="1"
      strokeLinecap="round"
      strokeLinejoin="round"
      d={`
M6.2,9.4
c0,0,0-0.1,0-0.2c0-0.2,0.1-0.3,0.1-0.4c0.2-0.4,0.5-0.7,1-0.7c0.3,0,0.5,0,0.6,0h0.1v0.7V10 M8.1,8.8c0,0,0-0.1,0-0.2
c0-0.2,0.1-0.3,0.1-0.4c0.2-0.4,0.5-0.7,1-0.7c0.3,0,0.5,0,0.6,0h0.1v1.9 M10.1,7.5v-2c0,0,0-0.1,0-0.2c0-0.2,0.1-0.3,0.1-0.4
c0.2-0.4,0.5-0.6,0.9-0.7c0.4,0,0.7,0.2,0.9,0.7C12,5,12,5.2,12,5.4c0,0.1,0,0.1,0,0.2v6c1.4-1.8,2.4-1.8,2.8,0.1
c-1.7,1.5-2.9,3.7-3.4,6.4l-5.8,0c-0.2-0.6-0.5-1.4-0.7-2.5c-0.3-1-0.5-2.5-0.6-4.5l0-0.8c0-0.1,0-0.1,0-0.2c0-0.2,0.1-0.3,0.1-0.4
c0.2-0.4,0.5-0.7,1-0.7c0.3,0,0.5,0,0.6,0l0.1,0v0.5c0,0,0,0,0,0l0,1.1l0,0.2 M6.2,10.9l0-0.4
      `}
    />
  </Svg.Svg>
);

const TouchEvents: Example = {
  icon,
  samples: [PressExample, HoverExample, GroupExample],
};

export default TouchEvents;
