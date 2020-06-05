import Constants from 'expo-constants';
import React from 'react';
import { StatusBar, StatusBarProps } from 'react-native';

export default function ExpoStatusBar(props: StatusBarProps) {
  const { translucent, ...otherProps } = props;

  // If the manifest is available and androidStatusBar is set in it, then base the
  // default value off of that. If it's not provided, we assume it is translucent.
  const defaultTranslucency = Constants.manifest?.androidStatusBar?.translucent ?? true;

  // Default status bar appearance is translucent in managed worklfow
  return <StatusBar translucent={translucent ?? defaultTranslucency} {...otherProps} />;
}
