import * as React from 'react';
import { Svg, SvgProps, Path } from 'react-native-svg';

const Icon: React.FunctionComponent<{ size: number } & SvgProps> = (props) => (
  <Svg
    viewBox="0 0 100 100"
    width={props.size}
    height={props.size}
    {...props}
  >
    <Path
      fill="rgb(220, 190, 40)"
      d="M0,0 L30,0 L30,2 L2,2 L2,30, L0,30z"
    />
    <Path
      fill="rgb(220, 190, 40)"
      d="M100,0 L100,30 L98,30 L98,2 L70,2, L70,0z"
    />
    <Path
      fill="rgb(220, 190, 40)"
      d="M100,100 L100,70 L98,70 L98,98 L70,98, L70,100z"
    />
    <Path
      fill="rgb(220, 190, 40)"
      d="M0,100 L0,70 L2,70 L2,98 L30,98, L30,100z"
    />
  </Svg>
);

export default Icon;
