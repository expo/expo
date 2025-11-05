import { NativeStackNavigationOptions } from '@react-navigation/native-stack';

import type { StackHeaderBackButtonProps } from '../types';

export function StackHeaderBackButton(props: StackHeaderBackButtonProps) {
  return null;
}

export function appendStackHeaderBackButtonPropsToOptions(
  options: NativeStackNavigationOptions,
  props: StackHeaderBackButtonProps
): NativeStackNavigationOptions {
  return {
    ...options,
    headerBackTitle: props.children,
    headerBackTitleStyle: props.style,
    headerBackImageSource: props.src,
    headerBackButtonDisplayMode: props.displayMode,
    headerBackButtonMenuEnabled: props.withMenu,
    headerBackVisible: !props.hidden,
  };
}
