import { IconProps } from '@expo/styleguide-native/dist/types';
import { useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import Svg, { SvgProps, G, Path, Defs, ClipPath, Circle, Rect } from 'react-native-svg';

export function ThreeFingerPressIcon(props: SvgProps & IconProps) {
  const { size, color, width, height } = props;

  const theme = useExpoTheme();

  return (
    <Svg width={size || width || 20} height={size || height || 20} viewBox="0 0 20 21" fill="none">
      <G clip-path="url(#clip0_1037_1803)">
        <Path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M14.2855 2H5.71404C5.47735 2 5.28547 2.22386 5.28547 2.5V7.2436C4.88752 7.08638 4.45385 7 4 7H3.99976V2.5C3.99976 1.39543 4.76727 0.5 5.71404 0.5H14.2855C15.2322 0.5 15.9998 1.39543 15.9998 2.5V7C15.5458 7.00003 15.1121 7.08648 14.714 7.2438V2.5C14.714 2.22386 14.5222 2 14.2855 2ZM14.714 13.7562V18.5C14.714 18.7761 14.5222 19 14.2855 19H5.71404C5.47735 19 5.28547 18.7761 5.28547 18.5V13.7564C4.88752 13.9136 4.45385 14 4 14H3.99976V18.5C3.99976 19.6046 4.76727 20.5 5.71404 20.5H14.2855C15.2322 20.5 15.9998 19.6046 15.9998 18.5V14C15.5458 14 15.1121 13.9135 14.714 13.7562Z"
          fill={color}
        />
        <Path
          d="M6.5 10.5C6.5 11.8807 5.38071 13 4 13C2.61929 13 1.5 11.8807 1.5 10.5C1.5 9.11929 2.61929 8 4 8C5.38071 8 6.5 9.11929 6.5 10.5Z"
          fill={color}
        />
        <Path
          d="M18.5 10.5C18.5 11.8807 17.3807 13 16 13C14.6193 13 13.5 11.8807 13.5 10.5C13.5 9.11929 14.6193 8 16 8C17.3807 8 18.5 9.11929 18.5 10.5Z"
          fill={color}
        />
        <Circle cx="10" cy="10.5" r="2.5" fill={color} />
      </G>
      <Defs>
        <ClipPath id="clip0_1037_1803">
          <Rect
            width="20"
            height="20"
            fill={theme.background.default}
            transform="translate(0 0.5)"
          />
        </ClipPath>
      </Defs>
    </Svg>
  );
}
