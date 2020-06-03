import React from 'react';
import { Appearance, StatusBar, StatusBarProps } from 'react-native';

export default function ExpoStatusBar(props: StatusBarProps) {
  let { barStyle, ...otherProps } = props;

  // Pick appropriate 'default' depending on current theme, so if we are locked to light mode
  // we don't end up with a light status bar
  if (props.barStyle === 'default') {
    barStyle = Appearance.getColorScheme() === 'light' ? 'dark-content' : 'light-content';
  }

  return <StatusBar barStyle={barStyle} {...otherProps} />;
}
