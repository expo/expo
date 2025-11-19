import type { NativeStackHeaderItemCustom } from '@react-navigation/native-stack';

export interface StackHeaderItemProps {
  /**
   * Can be any React node.
   */
  children?: NativeStackHeaderItemCustom['element'];
  hideSharedBackground?: boolean;
}

export function StackHeaderItem(props: StackHeaderItemProps) {
  return null;
}

export function convertStackHeaderItemPropsToRNHeaderItem(
  props: StackHeaderItemProps
): NativeStackHeaderItemCustom {
  const { children, ...rest } = props;
  if (!children) {
    console.warn(
      'Stack.Header.Item requires a child element to render custom content in the header.'
    );
  }
  return {
    ...rest,
    type: 'custom',
    element: children ?? <></>,
  };
}
