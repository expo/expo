import React from 'react';
import { TouchableHighlight, TouchableHighlightProps } from 'react-native';

export default function PlatformTouchable(props: React.PropsWithChildren<TouchableHighlightProps>) {
  return <TouchableHighlight underlayColor="lightgray" {...props} />;
}
