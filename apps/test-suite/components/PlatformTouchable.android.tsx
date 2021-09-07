import React from 'react';
import { TouchableNativeFeedback, TouchableNativeFeedbackProps } from 'react-native';

export default function PlatformTouchable(props: TouchableNativeFeedbackProps) {
  return <TouchableNativeFeedback {...props} />;
}
