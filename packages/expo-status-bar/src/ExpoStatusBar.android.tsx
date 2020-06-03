import React from 'react';
import { StatusBar, StatusBarProps } from 'react-native';

export default function ExpoStatusBar(props: StatusBarProps) {
  const { translucent, ...otherProps } = props;

  // Default status bar appearance is translucent in managed worklfow
  return <StatusBar translucent={translucent ?? true} {...otherProps} />;
}
