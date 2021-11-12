import * as React from 'react';
import Svg, { SvgProps, G, Path, Circle, Defs, ClipPath } from 'react-native-svg';

export function ThreeFingerPressIcon(props: SvgProps) {
  return (
    <Svg width={20} height={21} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <G clipPath="url(#prefix__clip0_1028_2236)" fill="#596068">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.285 2H5.714c-.237 0-.429.224-.429.5v4.743A3.49 3.49 0 004 7V2.5c0-1.105.767-2 1.714-2h8.571c.947 0 1.714.895 1.714 2V7c-.453 0-.887.086-1.285.244V2.5c0-.276-.192-.5-.429-.5zm.429 11.756V18.5c0 .276-.192.5-.429.5H5.714c-.237 0-.429-.224-.429-.5v-4.744A3.491 3.491 0 014 14v4.5c0 1.104.767 2 1.714 2h8.571c.947 0 1.714-.896 1.714-2V14c-.453 0-.887-.087-1.285-.244z"
        />
        <Path d="M6.5 10.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0zM18.5 10.5a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
        <Circle cx={10} cy={10.5} r={2.5} />
      </G>
      <Defs>
        <ClipPath id="prefix__clip0_1028_2236">
          <Path fill="#fff" transform="translate(0 .5)" d="M0 0h20v20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
