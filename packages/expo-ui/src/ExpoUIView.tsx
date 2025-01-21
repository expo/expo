import { requireNativeView } from 'expo';
import * as React from 'react';

import { ButtonProps, SingleChoiceSegmentedControlProps } from './ExpoUI.types';

const ButtonNativeView: React.ComponentType<ButtonProps> = requireNativeView('ExpoUI', 'Button');

export function Button(props: ButtonProps) {
  // Min height from https://m3.material.io/components/buttons/specs, minWidth
  return <ButtonNativeView style={[{ minWidth: 80, minHeight: 40 }, props.style]} {...props} />;
}
