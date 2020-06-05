import React from 'react';
import { StatusBar, StatusBarProps } from 'react-native';

import useColorScheme from './useColorScheme';

export default function ExpoStatusBar(props: StatusBarProps) {
  let { barStyle, ...otherProps } = props;

  const colorScheme = useColorScheme();

  // Pick appropriate 'default' depending on current theme, so if we are locked to light mode
  // we don't end up with a light status bar
  if (props.barStyle === 'default' || !props.barStyle) {
    barStyle = colorScheme === 'light' ? 'dark-content' : 'light-content';
  }

  return <StatusBar barStyle={barStyle} {...otherProps} />;
}
