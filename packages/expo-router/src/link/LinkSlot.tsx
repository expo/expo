import { Slot as RUISlot } from '@radix-ui/react-slot';
import { forwardRef, useMemo } from 'react';
import { StyleSheet } from 'react-native';

function ShimSlotForReactNative(Component: typeof RUISlot): typeof RUISlot {
  return forwardRef(function RNSlotHOC({ style, ...props }, ref) {
    style = useMemo(() => StyleSheet.flatten(style), [style]);
    return <Component ref={ref} {...props} style={style} />;
  });
}

export const Slot = ShimSlotForReactNative(RUISlot);
