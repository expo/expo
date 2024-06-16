import { IconProps } from '@expo/styleguide-native/dist/types';
import { useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import Svg, { SvgProps, Path } from 'react-native-svg';

export function ClipboardIcon(props: Pick<SvgProps, 'color' | 'width' | 'height'> & IconProps) {
  const { size, color, width, height } = props;

  const theme = useExpoTheme();

  return (
    <Svg width={size || width || 20} height={size || height || 20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13.3331 3.33301H14.9998C15.4418 3.33301 15.8657 3.5086 16.1783 3.82116C16.4909 4.13372 16.6665 4.55765 16.6665 4.99967V16.6663C16.6665 17.1084 16.4909 17.5323 16.1783 17.8449C15.8657 18.1574 15.4418 18.333 14.9998 18.333H4.9998C4.55777 18.333 4.13385 18.1574 3.82129 17.8449C3.50872 17.5323 3.33313 17.1084 3.33313 16.6663V4.99967C3.33313 4.55765 3.50872 4.13372 3.82129 3.82116C4.13385 3.5086 4.55777 3.33301 4.9998 3.33301H6.66646"
        stroke={color ?? theme.icon.default}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.5002 1.66699H7.5002C7.03997 1.66699 6.66687 2.04009 6.66687 2.50033V4.16699C6.66687 4.62723 7.03997 5.00033 7.5002 5.00033H12.5002C12.9604 5.00033 13.3335 4.62723 13.3335 4.16699V2.50033C13.3335 2.04009 12.9604 1.66699 12.5002 1.66699Z"
        stroke={color ?? theme.icon.default}
        strokeWidth="1.66667"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
