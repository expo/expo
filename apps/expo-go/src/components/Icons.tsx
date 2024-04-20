import DefaultIonicons from '@expo/vector-icons/build/Ionicons';
import DefaultMaterialIcons from '@expo/vector-icons/build/MaterialIcons';
import { useTheme } from '@react-navigation/native';
import * as React from 'react';
import { Svg, Path, SvgProps } from 'react-native-svg';

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

export function Share({ size, color, ...props }: { color: string; size: number }) {
  const fill = color;
  return (
    <Svg fill={fill} width={size} height={size} viewBox="0 0 24 24" {...props}>
      <Path d="M4 10a1 1 0 011 1v8a1 1 0 001 1h12a1 1 0 001-1v-8a1 1 0 112 0v8a3 3 0 01-3 3H6a3 3 0 01-3-3v-8a1 1 0 011-1z" />
      <Path d="M13 4.414V15a1 1 0 11-2 0V4.414L8.707 6.707a1 1 0 01-1.414-1.414l3.994-3.994a1.002 1.002 0 011.426 0l3.994 3.994a1 1 0 01-1.414 1.414L13 4.414z" />
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
