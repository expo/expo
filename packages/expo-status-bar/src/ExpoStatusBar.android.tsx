import React from 'react';
import { StatusBar, useColorScheme } from 'react-native';

import type { StatusBarProps } from './StatusBar.types';
import styleToBarStyle from './styleToBarStyle';

export default function ExpoStatusBar({
  style,
  animated,
  hidden,
  translucent = true,
  backgroundColor: backgroundColorProp,
}: StatusBarProps) {
  // Pick appropriate default value depending on current theme, so if we are
  // locked to light mode we don't end up with a light status bar
  const colorScheme = useColorScheme();

  // If translucent and no backgroundColor is provided, then use transparent
  // background
  let backgroundColor = backgroundColorProp;
  if (translucent && !backgroundColor) {
    backgroundColor = 'transparent';
  }

  return (
    <StatusBar
      translucent={translucent}
      barStyle={styleToBarStyle(style, colorScheme)}
      backgroundColor={backgroundColor}
      animated={animated}
      hidden={hidden}
    />
  );
}
