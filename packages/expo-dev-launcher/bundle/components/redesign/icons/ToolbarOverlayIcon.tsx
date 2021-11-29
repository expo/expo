import * as React from 'react';
import Svg, { SvgProps, Rect } from 'react-native-svg';

export function ToolbarOverlayIcon(props: SvgProps) {
  return (
    <Svg width={20} height={20} fill="none" xmlns="http://www.w3.org/2000/svg" {...props}>
      <Rect
        x={3.438}
        y={1.563}
        width={13.125}
        height={16.875}
        rx={1.563}
        stroke="#596068"
        strokeWidth={1.875}
      />
      <Rect x={8.75} y={8.125} width={5} height={7.5} rx={1.25} fill="#596068" />
    </Svg>
  );
}

