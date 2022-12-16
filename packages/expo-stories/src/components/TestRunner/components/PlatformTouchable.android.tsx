import React from 'react';
import { TouchableNativeFeedback } from 'react-native';

export default function PlatformTouchable(props) {
  return <TouchableNativeFeedback {...props} />;
}
