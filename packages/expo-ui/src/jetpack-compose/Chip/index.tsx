import { requireNativeView } from 'expo';
import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';

import { ExpoModifier } from '../../types';

/**
 * Available text style variants for chip labels.
 */
export type ChipTextStyle =
  | 'labelSmall'
  | 'labelMedium'
  | 'labelLarge'
  | 'bodySmall'
  | 'bodyMedium'
  | 'bodyLarge';

export interface ChipProps extends ViewProps {
  /**
   * The variant of the chip
   */
  variant?: 'assist' | 'filter' | 'input' | 'suggestion';

  /**
   * The text label to display on the chip
   */
  label: string;

  /**
   * Optional leading icon name (using Material Icons). Used for assist, filter, input (avatar icon), and suggestion chips.
   */
  leadingIcon?: string;

  /**
   * Optional trailing icon name (using Material Icons). Used for assist, filter, and input chips. For input chips, defaults to 'filled.Close' if not specified.
   */
  trailingIcon?: string;

  /**
   * Size of the icon in density-independent pixels (dp). Defaults to 18.
   */
  iconSize?: number;

  /**
   * Text style variant for the chip label. Defaults to 'labelSmall'.
   */
  textStyle?: ChipTextStyle;

  /**
   * Whether the chip is enabled and can be clicked. Used for assist, filter and input chips.
   */
  enabled?: boolean;

  /**
   * Whether the chip is selected. Used only for filter chips.
   */
  selected?: boolean;

  /**
   * Modifiers for the component
   */
  modifiers?: ExpoModifier[];

  /**
   * Callback fired when the chip is clicked. Used for assist and filter chips.
   */
  onPress?: () => void;

  /**
   * Callback fired when the chip is dismissed. Only used for input chips.
   */
  onDismiss?: () => void;
}

// Native component declaration using the same pattern as Button
const ChipNativeView: React.ComponentType<ChipProps> = requireNativeView('ExpoUI', 'ChipView');

/**
 * @hidden
 */
export function transformChipProps(props: ChipProps): ChipProps {
  const { modifiers, ...restProps } = props;
  return {
    ...restProps,
    // @ts-expect-error
    modifiers: props.modifiers?.map((m) => m.__expo_shared_object_id__),
  };
}

/**
 * Displays a native chip component.
 */
export function Chip(props: ChipProps): React.JSX.Element {
  // Min height from https://m3.material.io/components/chips/specs, minWidth
  return (
    <ChipNativeView
      {...transformChipProps(props)}
      style={StyleSheet.compose({ minWidth: 100, height: 32 }, props.style)}
    />
  );
}
