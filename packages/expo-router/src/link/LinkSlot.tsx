import { Slot as RUISlot } from '@radix-ui/react-slot';
import { forwardRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';

/**
 * RadixUI has special logic to handle the merging of `style` and `className` props.
 * On the web styles are not allowed so Radix does not handle this scenario.
 * This could be fixed upstream (PR open), but it may not as RN is not their target
 * platform.
 *
 * This shim calls `StyleSheet.flatten` on the styles before we render the <Slot />
 *
 * @see https://github.com/expo/expo/issues/31352
 * @see https://github.com/radix-ui/primitives/issues/3107
 * @param Component
 * @returns
 */
function ShimSlotForReactNative(Component: typeof RUISlot): typeof RUISlot {
  return forwardRef(function RNSlotHOC({ style, ...props }, ref) {
    style = useMemo(() => StyleSheet.flatten(style), [style]);
    return <Component ref={ref} {...props} style={style} />;
  });
}

export const Slot = ShimSlotForReactNative(RUISlot);
