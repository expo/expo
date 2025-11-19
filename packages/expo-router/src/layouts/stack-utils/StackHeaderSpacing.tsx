import type { NativeStackHeaderItemSpacing } from '@react-navigation/native-stack';

export interface StackHeaderSpacingProps {
  /**
   * The width of the spacing element.
   *
   * This is typically used to create space between header elements.
   */
  width: number;
}

export function StackHeaderSpacing(props: StackHeaderSpacingProps) {
  return null;
}

export function convertStackHeaderSpacingPropsToRNHeaderItem(
  props: StackHeaderSpacingProps
): NativeStackHeaderItemSpacing {
  return {
    type: 'spacing',
    spacing: props.width,
  };
}
