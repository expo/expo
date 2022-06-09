import DefaultIonicons from '@expo/vector-icons/build/Ionicons';
import DefaultMaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Platform } from 'react-native';
import { Svg, Path, SvgProps } from 'react-native-svg';

import Colors from '../constants/Colors';

type Props = {
  size?: number;
  style?: any;
  lightColor?: string;
  darkColor?: string;
  color?: string;
};

type IconiconNames = React.ComponentProps<typeof DefaultIonicons>['name'];
export const Ionicons = (props: Props & { name: IconiconNames }) => {
  const theme = useTheme();
  const darkColor = props.darkColor || '#fff';
  const lightColor = props.lightColor || '#ccc';

  return <DefaultIonicons color={theme.dark ? darkColor : lightColor} {...props} />;
};

type MaterialIconNames = React.ComponentProps<typeof DefaultMaterialIcons>['name'];
export const MaterialIcons = (props: Props & { name: MaterialIconNames }) => {
  const theme = useTheme();
  const darkColor = props.darkColor || '#fff';
  const lightColor = props.lightColor || '#ccc';

  return <DefaultMaterialIcons color={theme.dark ? darkColor : lightColor} {...props} />;
};

export function Github({
  size,
  darkColor = '#fff',
  lightColor = '#000',
  ...props
}: Omit<Props, 'name'>) {
  const theme = useTheme();
  const fill = theme.dark ? darkColor : lightColor;
  return (
    <Svg width={size} fill={fill} height={size} viewBox="0 0 496 512" {...props}>
      <Path d="M165.9 397.4c0 2-2.3 3.6-5.2 3.6-3.3.3-5.6-1.3-5.6-3.6 0-2 2.3-3.6 5.2-3.6 3-.3 5.6 1.3 5.6 3.6zm-31.1-4.5c-.7 2 1.3 4.3 4.3 4.9 2.6 1 5.6 0 6.2-2s-1.3-4.3-4.3-5.2c-2.6-.7-5.5.3-6.2 2.3zm44.2-1.7c-2.9.7-4.9 2.6-4.6 4.9.3 2 2.9 3.3 5.9 2.6 2.9-.7 4.9-2.6 4.6-4.6-.3-1.9-3-3.2-5.9-2.9zM244.8 8C106.1 8 0 113.3 0 252c0 110.9 69.8 205.8 169.5 239.2 12.8 2.3 17.3-5.6 17.3-12.1 0-6.2-.3-40.4-.3-61.4 0 0-70 15-84.7-29.8 0 0-11.4-29.1-27.8-36.6 0 0-22.9-15.7 1.6-15.4 0 0 24.9 2 38.6 25.8 21.9 38.6 58.6 27.5 72.9 20.9 2.3-16 8.8-27.1 16-33.7-55.9-6.2-112.3-14.3-112.3-110.5 0-27.5 7.6-41.3 23.6-58.9-2.6-6.5-11.1-33.3 2.6-67.9 20.9-6.5 69 27 69 27 20-5.6 41.5-8.5 62.8-8.5s42.8 2.9 62.8 8.5c0 0 48.1-33.6 69-27 13.7 34.7 5.2 61.4 2.6 67.9 16 17.7 25.8 31.5 25.8 58.9 0 96.5-58.9 104.2-114.8 110.5 9.2 7.9 17 22.9 17 46.4 0 33.7-.3 75.4-.3 83.6 0 6.5 4.6 14.4 17.3 12.1C428.2 457.8 496 362.9 496 252 496 113.3 383.5 8 244.8 8zM97.2 352.9c-1.3 1-1 3.3.7 5.2 1.6 1.6 3.9 2.3 5.2 1 1.3-1 1-3.3-.7-5.2-1.6-1.6-3.9-2.3-5.2-1zm-10.8-8.1c-.7 1.3.3 2.9 2.3 3.9 1.6 1 3.6.7 4.3-.7.7-1.3-.3-2.9-2.3-3.9-2-.6-3.6-.3-4.3.7zm32.4 35.6c-1.6 1.3-1 4.3 1.3 6.2 2.3 2.3 5.2 2.6 6.5 1 1.3-1.3.7-4.3-1.3-6.2-2.2-2.3-5.2-2.6-6.5-1zm-11.4-14.7c-1.6 1-1.6 3.6 0 5.9 1.6 2.3 4.3 3.3 5.6 2.3 1.6-1.3 1.6-3.9 0-6.2-1.4-2.3-4-3.3-5.6-2z" />
    </Svg>
  );
}

export function Share({ size, color, ...props }: { color: string; size: number }) {
  const fill = color;
  return (
    <Svg fill={fill} width={size} height={size} viewBox="0 0 24 24" {...props}>
      <Path d="M4 10a1 1 0 011 1v8a1 1 0 001 1h12a1 1 0 001-1v-8a1 1 0 112 0v8a3 3 0 01-3 3H6a3 3 0 01-3-3v-8a1 1 0 011-1z" />
      <Path d="M13 4.414V15a1 1 0 11-2 0V4.414L8.707 6.707a1 1 0 01-1.414-1.414l3.994-3.994a1.002 1.002 0 011.426 0l3.994 3.994a1 1 0 01-1.414 1.414L13 4.414z" />
    </Svg>
  );
}

export function Privacy({
  isUnlisted,
  size,
  style,
}: {
  isUnlisted?: boolean;
  style?: any;
  size: number;
}) {
  const lightColor = Colors.light.tintColor;
  const darkColor = Colors.dark.tintColor;

  if (isUnlisted === true) {
    return (
      <MaterialIcons
        name="link"
        lightColor={lightColor}
        darkColor={darkColor}
        size={size}
        style={style}
      />
    );
  }

  return (
    <MaterialIcons
      name="remove-red-eye"
      lightColor={lightColor}
      darkColor={darkColor}
      size={size - 2}
      style={style}
    />
  );
}

export function Store({
  size,
  darkColor = '#fff',
  lightColor = '#000',
  ...props
}: Omit<Props, 'name'>) {
  const theme = useTheme();
  const fill = theme.dark ? darkColor : lightColor;

  if (Platform.OS === 'ios') {
    return (
      <Svg width={size} fill={fill} height={size} viewBox="0 0 512 512" {...props}>
        <Path d="M255.9 120.9l9.1-15.7c5.6-9.8 18.1-13.1 27.9-7.5 9.8 5.6 13.1 18.1 7.5 27.9l-87.5 151.5h63.3c20.5 0 32 24.1 23.1 40.8H113.8c-11.3 0-20.4-9.1-20.4-20.4 0-11.3 9.1-20.4 20.4-20.4h52l66.6-115.4-20.8-36.1c-5.6-9.8-2.3-22.2 7.5-27.9 9.8-5.6 22.2-2.3 27.9 7.5l8.9 15.7zm-78.7 218l-19.6 34c-5.6 9.8-18.1 13.1-27.9 7.5-9.8-5.6-13.1-18.1-7.5-27.9l14.6-25.2c16.4-5.1 29.8-1.2 40.4 11.6zm168.9-61.7h53.1c11.3 0 20.4 9.1 20.4 20.4 0 11.3-9.1 20.4-20.4 20.4h-29.5l19.9 34.5c5.6 9.8 2.3 22.2-7.5 27.9-9.8 5.6-22.2 2.3-27.9-7.5-33.5-58.1-58.7-101.6-75.4-130.6-17.1-29.5-4.9-59.1 7.2-69.1 13.4 23 33.4 57.7 60.1 104zM256 8C119 8 8 119 8 256s111 248 248 248 248-111 248-248S393 8 256 8zm216 248c0 118.7-96.1 216-216 216-118.7 0-216-96.1-216-216 0-118.7 96.1-216 216-216 118.7 0 216 96.1 216 216z" />
      </Svg>
    );
  }

  return (
    <Svg width={size} fill={fill} height={size} viewBox="0 0 512 512" {...props}>
      <Path d="M325.3 234.3L104.6 13l280.8 161.2-60.1 60.1zM47 0C34 6.8 25.3 19.2 25.3 35.3v441.3c0 16.1 8.7 28.5 21.7 35.3l256.6-256L47 0zm425.2 225.6l-58.9-34.1-65.7 64.5 65.7 64.5 60.1-34.1c18-14.3 18-46.5-1.2-60.8zM104.6 499l280.8-161.2-60.1-60.1L104.6 499z" />
    </Svg>
  );
}

export default function DiagnosticsIcon(props: SvgProps & Props) {
  const { size, color, width, height } = props;
  return (
    <Svg
      width={size || width || 20}
      height={size || height || 20}
      viewBox="0 0 20 20"
      fill="none"
      {...props}>
      <Path
        d="M13.8 2.7998H15.6C16.0774 2.7998 16.5353 2.98945 16.8728 3.32701C17.2104 3.66458 17.4 4.12242 17.4 4.59981V17.1998C17.4 17.6772 17.2104 18.1351 16.8728 18.4726C16.5353 18.8102 16.0774 18.9999 15.6 18.9999H4.80001C4.32261 18.9999 3.86478 18.8102 3.52721 18.4726C3.18964 18.1351 3 17.6772 3 17.1998V4.59981C3 4.12242 3.18964 3.66458 3.52721 3.32701C3.86478 2.98945 4.32261 2.7998 4.80001 2.7998H6.60001"
        stroke={color || '#000'}
        strokeWidth="1.80001"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12.8999 1H7.49986C7.0028 1 6.59985 1.40294 6.59985 1.9V3.70001C6.59985 4.19707 7.0028 4.60001 7.49986 4.60001H12.8999C13.3969 4.60001 13.7999 4.19707 13.7999 3.70001V1.9C13.7999 1.40294 13.3969 1 12.8999 1Z"
        stroke={color || '#000'}
        strokeWidth="1.80001"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M6 12H7.5L9 8.5L11.5 14.5L13 12H14.5"
        stroke={color || '#000'}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
