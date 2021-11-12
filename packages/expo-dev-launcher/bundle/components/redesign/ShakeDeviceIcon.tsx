import * as React from 'react';
import Svg, { SvgProps, G, Rect, Path, Defs, ClipPath } from 'react-native-svg';

export function ShakeDeviceIcon(props: SvgProps) {
  return (
    <Svg width={20} height={21} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <G clipPath="url(#prefix__clip0_1028_2230)">
        <Rect
          x={4.75}
          y={1.25}
          width={10.5}
          height={18.5}
          rx={1.25}
          stroke="#596068"
          strokeWidth={1.5}
        />
        <Path
          d="M2.772 9.168A3.776 3.776 0 016.55 5.392a1 1 0 000-2 5.776 5.776 0 100 11.552 1 1 0 100-2 3.776 3.776 0 01-3.777-3.776z"
          fill="#596068"
          stroke="#fff"
          strokeLinecap="round"
        />
        <Path
          d="M5.087 9.168c0-.984.798-1.782 1.782-1.782a.935.935 0 000-1.87 3.652 3.652 0 000 7.304.935.935 0 100-1.87 1.782 1.782 0 01-1.782-1.782zM17.308 12.168a3.776 3.776 0 00-3.777-3.776 1 1 0 110-2 5.776 5.776 0 010 11.552 1 1 0 110-2 3.776 3.776 0 003.777-3.776z"
          fill="#596068"
          stroke="#fff"
          strokeLinecap="round"
        />
        <Path
          d="M14.993 12.168c0-.984-.798-1.782-1.782-1.782a.935.935 0 110-1.87 3.652 3.652 0 010 7.304.935.935 0 110-1.87c.984 0 1.782-.798 1.782-1.782z"
          fill="#596068"
          stroke="#fff"
          strokeLinecap="round"
        />
      </G>
      <Defs>
        <ClipPath id="prefix__clip0_1028_2230">
          <Path fill="#fff" transform="translate(0 .5)" d="M0 0h20v20H0z" />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
