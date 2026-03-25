'use client';

import { NativeToolbarView } from './native';
import type { StackToolbarViewProps } from './types';
import type { NativeStackHeaderItemCustom } from '../../../../react-navigation/native-stack';
import { useToolbarPlacement } from '../context';

export type { StackToolbarViewProps, NativeToolbarViewProps } from './types';

/**
 * A wrapper to render custom content in the toolbar.
 *
 * Use inside `Stack.Toolbar` to render a custom React element.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 * import { Text } from 'react-native';
 *
 * function CustomElement() {
 *   return <Text>Custom Element</Text>;
 * }
 *
 * export default function Page() {
 *   return (
 *     <>
 *       <Stack.Toolbar>
 *         <Stack.Toolbar.View>
 *           <CustomElement />
 *         </Stack.Toolbar.View>
 *       </Stack.Toolbar>
 *       <ScreenContent />
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackToolbarView: React.FC<StackToolbarViewProps> = (props) => {
  const placement = useToolbarPlacement();

  if (placement !== 'bottom') {
    throw new Error('Stack.Toolbar.View must be used inside a Stack.Toolbar');
  }

  return <NativeToolbarView {...props}>{props.children}</NativeToolbarView>;
};

export function convertStackToolbarViewPropsToRNHeaderItem(
  props: StackToolbarViewProps
): NativeStackHeaderItemCustom | undefined {
  if (props.hidden) {
    return undefined;
  }
  const { children, hidesSharedBackground } = props;
  if (!children) {
    console.warn(
      'Stack.Toolbar.View requires a child element to render custom content in the toolbar.'
    );
  }
  const element = children ? children : <></>;
  return {
    type: 'custom',
    element,
    hidesSharedBackground,
  };
}
