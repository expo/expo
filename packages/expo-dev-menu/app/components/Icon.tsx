import React from 'react';
import { Text } from 'react-native';

import Colors from '../constants/Colors';
// @ts-ignore
import ioniconsMap from '../glyphmaps/Ionicons.json';
// @ts-ignore
import materialCommunityIconsMap from '../glyphmaps/MaterialCommunityIcons.json';
import { useThemeName } from './Views';

type BaseIconProps = {
  name: string;
  color: string;
  size?: number;
};

type IconProps = BaseIconProps & {
  fontFamily: string;
  glyphMap: Record<string, number>;
};

const Icon = ({ name, glyphMap, color, size, fontFamily }: IconProps) => {
  const themeName = useThemeName();
  const themeBaseColor = Colors[themeName]?.[color];

  if (!glyphMap[name]) {
    return <Text />;
  }
  const glyph = String.fromCodePoint(glyphMap[name]);

  return (
    <Text
      style={{
        fontFamily,
        fontSize: size || 14,
        color: themeBaseColor,
      }}>
      {glyph}
    </Text>
  );
};

export const MaterialCommunityIcon = (props: BaseIconProps) => {
  return (
    <Icon {...props} fontFamily="Material Design Icons" glyphMap={materialCommunityIconsMap} />
  );
};

export const Ionicon = (props: BaseIconProps) => {
  return <Icon {...props} fontFamily="Ionicons" glyphMap={ioniconsMap} />;
};
