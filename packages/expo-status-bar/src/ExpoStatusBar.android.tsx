import React from 'react';
import { StatusBar } from 'react-native';

import { StatusBarProps } from './StatusBar.types';
import styleToBarStyle from './styleToBarStyle';
import useColorScheme from './useColorScheme';

export default function ExpoStatusBar(props: StatusBarProps) {
  const {
    style,
    animated,
    hidden,
    backgroundColor: backgroundColorProp,
    translucent: translucentProp,
  } = props;

  // Default to true for translucent
  const translucent = translucentProp ?? true;

  // Pick appropriate default value depending on current theme, so if we are
  // locked to light mode we don't end up with a light status bar
  const colorScheme = useColorScheme();
  const barStyle = styleToBarStyle(style, colorScheme);

  // If translucent and no backgroundColor is provided, then use transparent
  // background
  let backgroundColor = backgroundColorProp;
  if (translucent && !backgroundColor) {
    backgroundColor = 'transparent';
  }

  return (
    <StatusBar
      barStyle={barStyle}
      backgroundColor={backgroundColor}
      animated={animated}
      hidden={hidden}
    />
  );
}
