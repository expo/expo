import type { NativeStackHeaderItemSpacing } from '@react-navigation/native-stack';

export interface StackHeaderSpacerProps {
  /**
   * Whether the spacer should be hidden.
   *
   * @default false
   */
  hidden?: boolean;
  // TODO: implement fluid spacing in react-native-screens
  /**
   * The width of the spacing element.
   *
   * This is typically used to create space between header elements.
   */
  width: number;
  // TODO: implement missing props in react-native-screens
  // hidesSharedBackground?: boolean;
  // sharesBackground?: boolean;
}

/**
 * A spacing helper used inside `Stack.Header.Left` or `Stack.Header.Right` to create
 * empty space between header items.
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
 *             <Stack.Header.Button icon="arrow.left" />
 *             <Stack.Header.Spacer width={8} />
 *             <Stack.Header.Button icon="arrow.right" />
 *           </Stack.Header.Left>
 *         </Stack.Header>
 *       </Stack.Screen>
 *     </>
 *   );
 * }
 * ```
 *
 * @platform ios
 */
export const StackHeaderSpacer: React.FC<StackHeaderSpacerProps> = () => null;

export function convertStackHeaderSpacerPropsToRNHeaderItem({
  hidden,
  width,
}: StackHeaderSpacerProps): NativeStackHeaderItemSpacing | undefined {
  if (hidden) {
    return undefined;
  }
  return {
    type: 'spacing',
    spacing: width,
  };
}
