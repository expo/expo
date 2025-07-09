import { IconProps } from '@expo/styleguide-native/dist/types';
import { useExpoTheme } from 'expo-dev-client-components';
import * as React from 'react';
import Svg, { SvgProps, G, Path, Defs, ClipPath, Rect } from 'react-native-svg';

export function ShakeDeviceIcon(props: SvgProps & IconProps) {
  const { size, color, width, height } = props;
  const theme = useExpoTheme();

  return (
    <Svg width={size || width || 20} height={size || height || 20} viewBox="0 0 20 21" fill="none">
      <G clipPath="url(#clip0_1037_1797)">
        <Rect
          x="4.75"
          y="1.25"
          width="10.5"
          height="18.5"
          rx="1.25"
          stroke={color}
          strokeWidth="1.5"
        />
        <Path
          d="M2.77246 9.16799C2.77246 7.08248 4.4631 5.39185 6.54861 5.39185C7.10089 5.39185 7.54861 4.94413 7.54861 4.39185C7.54861 3.83956 7.10089 3.39185 6.54861 3.39185C3.35853 3.39185 0.772461 5.97792 0.772461 9.16799C0.772461 12.3581 3.35853 14.9441 6.54861 14.9441C7.10089 14.9441 7.54861 14.4964 7.54861 13.9441C7.54861 13.3919 7.10089 12.9441 6.54861 12.9441C4.4631 12.9441 2.77246 11.2535 2.77246 9.16799Z"
          fill={color}
          stroke={theme.background.default}
          strokeLinecap="round"
        />
        <Path
          d="M5.08734 9.16803C5.08734 8.18394 5.88511 7.38617 6.86921 7.38617C7.38574 7.38617 7.80448 6.96744 7.80448 6.4509C7.80448 5.93436 7.38574 5.51562 6.86921 5.51562C4.85204 5.51562 3.2168 7.15086 3.2168 9.16803C3.2168 11.1852 4.85204 12.8204 6.86921 12.8204C7.38574 12.8204 7.80448 12.4017 7.80448 11.8852C7.80448 11.3686 7.38574 10.9499 6.86921 10.9499C5.88511 10.9499 5.08734 10.1521 5.08734 9.16803Z"
          fill={color}
          stroke={theme.background.default}
          strokeLinecap="round"
        />
        <Path
          d="M17.3075 12.168C17.3075 10.0825 15.6169 8.39185 13.5313 8.39185C12.9791 8.39185 12.5313 7.94413 12.5313 7.39185C12.5313 6.83956 12.9791 6.39185 13.5313 6.39185C16.7214 6.39185 19.3075 8.97792 19.3075 12.168C19.3075 15.3581 16.7214 17.9441 13.5313 17.9441C12.9791 17.9441 12.5313 17.4964 12.5313 16.9441C12.5313 16.3919 12.9791 15.9441 13.5313 15.9441C15.6169 15.9441 17.3075 14.2535 17.3075 12.168Z"
          fill={color}
          stroke={theme.background.default}
          strokeLinecap="round"
        />
        <Path
          d="M14.9926 12.168C14.9926 11.1839 14.1948 10.3862 13.2108 10.3862C12.6942 10.3862 12.2755 9.96744 12.2755 9.4509C12.2755 8.93436 12.6942 8.51562 13.2108 8.51562C15.2279 8.51562 16.8632 10.1509 16.8632 12.168C16.8632 14.1852 15.2279 15.8204 13.2108 15.8204C12.6942 15.8204 12.2755 15.4017 12.2755 14.8852C12.2755 14.3686 12.6942 13.9499 13.2108 13.9499C14.1948 13.9499 14.9926 13.1521 14.9926 12.168Z"
          fill={color}
          stroke={theme.background.default}
          strokeLinecap="round"
        />
      </G>
      <Defs>
        <ClipPath id="clip0_1037_1797">
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
