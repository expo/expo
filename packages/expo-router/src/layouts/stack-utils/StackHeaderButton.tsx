import type { NativeStackHeaderItemButton } from '@react-navigation/native-stack';

import {
  convertStackHeaderSharedPropsToRNSharedHeaderItem,
  type StackHeaderItemSharedProps,
} from './shared';

export interface StackHeaderButtonProps extends StackHeaderItemSharedProps {
  onPress?: () => void;
  selected?: boolean;
}

/**
 * A header button used inside `Stack.Header.Left` or `Stack.Header.Right`.
 *
 * @example
 * ```tsx
 * import { Stack } from 'expo-router';
 *
 * export default function Screen() {
 *   return (
 *     <>
 *       <ScreenContent />
 *       <Stack.Screen>
 *         <Stack.Header>
 *           <Stack.Header.Left>
 *             <Stack.Header.Button tintColor="blue" icon="arrow.left.circle" onPress={() => alert('Left pressed')} />
 *             <Stack.Header.Button style={{ color: 'green' }} onPress={() => alert('2 pressed')}>
 *               <Stack.Header.Label>2</Stack.Header.Label>
 *             </Stack.Header.Button>
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @see [Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/toolbars) for more information about navigation bar items on iOS.
 *
 * @platform ios
 */
export const StackHeaderButton: React.FC<StackHeaderButtonProps> = () => null;

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
