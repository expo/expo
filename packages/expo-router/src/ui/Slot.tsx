import { Slot as RUISlot } from '@radix-ui/react-slot';
import React, {
  forwardRef,
  useMemo,
  type ForwardRefExoticComponent,
  type Component,
  type RefAttributes,
} from 'react';
import { StyleSheet, type ViewProps } from 'react-native';

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
  return forwardRef(function RNSlotHOC({ style, children, ...props }, ref) {
    const flattenedStyle = useMemo(() => StyleSheet.flatten(style), [style]);
    const childStyle =
      React.isValidElement(children) &&
      typeof children.props === 'object' &&
      children.props !== null
        ? (children.props as { style?: unknown }).style
        : undefined;

    if (process.env.NODE_ENV !== 'production') {
      if (Array.isArray(childStyle)) {
        throw new Error(
          `[expo-router]: You are passing an array of styles to a child of <Slot>. Consider flattening the styles with StyleSheet.flatten before passing them to the child component.`
        );
      }
    }

    // Radix merges `style` with an object spread, so a style function on the child
    // turns into an empty object. Move the function onto the <Slot /> itself and drop
    // it from the child, so `mergeProps` never enters its `style` branch.
    const composedStyle = useMemo(() => {
      if (typeof childStyle !== 'function') {
        return flattenedStyle;
      }
      return (state: unknown) =>
        flattenedStyle ? [flattenedStyle, childStyle(state)] : childStyle(state);
    }, [flattenedStyle, childStyle]);

    const slotChildren = useMemo(() => {
      if (typeof childStyle !== 'function' || !React.isValidElement(children)) {
        return children;
      }
      const { style: _omitted, ...rest } = children.props as Record<string, unknown>;
      return React.createElement(children.type, { ...rest, key: children.key });
    }, [children, childStyle]);

    return (
      <Component
        ref={ref}
        {...props}
        // Radix types `style` as `CSSProperties`; React Native also accepts a function.
        style={composedStyle as unknown as React.CSSProperties}>
        {slotChildren}
      </Component>
    );
  });
}

export interface Slot<
  Props = ViewProps,
  Ref = Component<ViewProps>,
> extends ForwardRefExoticComponent<Props & RefAttributes<Ref>> {}

export const Slot: Slot = ShimSlotForReactNative(RUISlot) as Slot;
