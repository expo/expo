import * as React from 'react';
import { Svg, Circle, SvgProps } from 'react-native-svg';

const Icon: React.FunctionComponent<SvgProps> = (props) => (
  <Svg
    viewBox="0 0 100 100"
    width={60}
    height={60}
    {...props}
  >
    <Circle
      cx="50"
      cy="50"
      r="35"
      fill="white"
    />
    <Circle
      cx="50"
      cy="50"
      r="45"
      strokeWidth="10"
      stroke="white"
      fill="none"
    />
  </Svg>
);

export default Icon;
