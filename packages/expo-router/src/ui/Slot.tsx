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
 * Radix merges `style` with an object spread, so a style function on the child becomes an
 * empty object. When <Slot /> has no style of its own, the function is moved onto <Slot />
 * and removed from the child, so `mergeProps` never enters its `style` branch.
 *
 * @see https://github.com/expo/expo/issues/32775
 */
function hoistChildStyle(children: React.ReactNode, childStyle: unknown, slotStyle: unknown) {
  if (
    typeof childStyle !== 'function' ||
    slotStyle !== undefined ||
    !React.isValidElement(children)
  ) {
    return { style: slotStyle, children };
  }

  const { style: _omitted, ...rest } = children.props as Record<string, unknown>;
  return {
    style: childStyle,
    children: React.createElement(children.type, { ...rest, key: children.key }),
  };
}

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
      if (typeof childStyle === 'function' && flattenedStyle !== undefined) {
        throw new Error(
          `[expo-router]: You are passing a style function to a child of <Slot> while <Slot> also has a style. Consider combining both in the child function.`
        );
      }
    }

    const { style: slotStyle, children: slotChildren } = hoistChildStyle(
      children,
      childStyle,
      flattenedStyle
    );

    return (
      <Component
        ref={ref}
        {...props}
        // Radix types `style` as `CSSProperties`; React Native also accepts a function.
        style={slotStyle as React.CSSProperties}>
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
