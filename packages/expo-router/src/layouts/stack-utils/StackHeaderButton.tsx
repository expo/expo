import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';

import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  type StackHeaderItemSharedProps,
} from './shared';

export interface StackHeaderButtonProps extends StackHeaderItemSharedProps {
  onPress?: () => void;
  selected?: boolean;
}

export function StackHeaderButton(props: StackHeaderButtonProps) {
  return null;
}

export function convertStackHeaderButtonPropsToRNHeaderItem(
  props: StackHeaderButtonProps
): NativeStackHeaderItemButton {
  return {
    ...convertStackHeaderSharedPropsToRNSharedHeaderItem(props),
    type: 'button',
    onPress: props.onPress ?? (() => {}),
    selected: !!props.selected,
  };
}
