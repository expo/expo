import React from 'react';
import { Platform, TouchableHighlight, TouchableNativeFeedback } from 'react-native';

export default function PlatformTouchable(props) {
  if (Platform.OS === 'android') {
    return <TouchableNativeFeedback {...props} />;
  }
  return <TouchableHighlight underlayColor="lightgray" {...props} />;
}
