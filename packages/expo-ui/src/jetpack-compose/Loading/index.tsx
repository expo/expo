import { requireNativeView } from 'expo';
import { ColorValue, StyleProp, ViewStyle } from 'react-native';

import { ExpoModifier } from '../../types';

export type LoadingIndicatorVariant = 'default' | 'contained';

export type LoadingIndicatorProps = {
  /**
   * The variant of the loading indicator.
   * - `default`: A standard loading indicator with morphing shapes.
   * - `contained`: A loading indicator inside a circular colored background.
   *
   * @default 'default'
   * @platform android
   */
  variant?: LoadingIndicatorVariant;
  /**
   * The progress value of the indicator.
   * - If provided: Determinate mode - morphs shapes based on progress value.
   * - If null/undefined: Indeterminate mode - continuous morphing animation.
   *
   * This is a number between `0` and `1`.
   */
  progress?: number | null;
  /**
   * The color of the loading indicator shapes.
   *
   * - Default variant: Color of the morphing shapes
   * - Contained variant: Color of the indicator (defaults to white)
   */
  color?: ColorValue;
  /**
   * The color of the circular background container.
   * Only applies when `variant` is `contained`.
   */
  containerColor?: ColorValue;
  /**
   * Custom styles for the component.
   */
  style?: StyleProp<ViewStyle>;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

const NativeLoadingIndicatorView: React.ComponentType<LoadingIndicatorProps> = requireNativeView(
  'ExpoUI',
  'LoadingView'
);

/**
 * Renders a `LoadingIndicator` component.
 */
export function LoadingIndicator(props: LoadingIndicatorProps) {
  return (
    <NativeLoadingIndicatorView
      {...props}
      variant={props.variant ?? 'default'}
      // @ts-expect-error: modifiers conversion
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
    />
  );
}
