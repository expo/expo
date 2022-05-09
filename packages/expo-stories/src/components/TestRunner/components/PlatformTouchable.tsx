import React from 'react';
import { TouchableHighlight } from 'react-native';

export default function PlatformTouchable(props) {
  return <TouchableHighlight underlayColor="lightgray" {...props} />;
}
