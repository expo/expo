import * as React from 'react';
import Svg, { SvgProps, G, Path, Defs, ClipPath } from 'react-native-svg';

export function ShowMenuIcon(props: SvgProps) {
  return (
    <Svg width={20} height={20} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <G
        clipPath="url(#prefix__clip0_1028_2108)"
        fillRule="evenodd"
        clipRule="evenodd"
        fill="#596068">
        <Path d="M0 2a2 2 0 012-2h16a2 2 0 012 2v11a2 2 0 01-2 2h-7.119V7.175l3.636 3.636a.881.881 0 001.247-1.246l-5.14-5.14a.881.881 0 00-1.247 0l-5.14 5.14a.881.881 0 101.246 1.246L9.12 7.176V15H2a2 2 0 01-2-2V2zM10.889 15v4c0 .552-.399 1-.89 1-.492 0-.89-.448-.89-1v-4h1.78z" />
      </G>
      <Defs>
        <ClipPath id="prefix__clip0_1028_2108">
          <Path fill="#fff" transform="matrix(0 1 1 0 0 0)" d="M0 0h20v20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
