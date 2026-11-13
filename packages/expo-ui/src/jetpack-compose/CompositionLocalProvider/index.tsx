import { requireNativeView } from 'expo';
import type { ReactNode } from 'react';

/**
 * Composition local values that `CompositionLocalProvider` can provide.
 */
export type CompositionLocalValues = {
  /**
   * The minimum size, in dp, that Material components such as `Button`, `IconButton`, `Checkbox`, and
   * `Switch` reserve for their touch target. Maps to `LocalMinimumInteractiveComponentSize`.
   * Set it to `0` to let these components be smaller than Material's default of 48dp.
   */
  minimumInteractiveComponentSize?: number;
};

export type CompositionLocalProviderProps = {
  /**
   * The values to provide to the children.
   */
  values: CompositionLocalValues;
  /**
   * The content that receives the values.
   */
  children?: ReactNode;
};

type NativeCompositionLocalProviderProps = CompositionLocalValues & {
  children?: ReactNode;
};

const CompositionLocalProviderNativeView: React.ComponentType<NativeCompositionLocalProviderProps> =
  requireNativeView('ExpoUI', 'CompositionLocalProviderView');

/**
 * Provides composition local values to its children, like Jetpack Compose's `CompositionLocalProvider`.
 * It adds no layout of its own, so children keep modifiers such as `weight` from the parent `Row`
 * or `Column`.
 */
export function CompositionLocalProvider({ values, children }: CompositionLocalProviderProps) {
  return (
    <CompositionLocalProviderNativeView {...values}>{children}</CompositionLocalProviderNativeView>
  );
}
