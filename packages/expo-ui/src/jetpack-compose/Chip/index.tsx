import { requireNativeView } from 'expo';
import React from 'react';
import { StyleSheet, ViewProps } from 'react-native';

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
   * Optional leading icon name (using Material Icons). Used for assist, filter and input (avatar icon) chips.
   */
  leadingIcon?: string;

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
   * Callback fired when the chip is clicked. Used for assist and filter chips.
   */
  onPress?: () => void;

  /**
   * Callback fired when the chip is dismissed. Only used for input chips.
   */
  onDismiss?: () => void;
}

type NativeChipProps = Omit<ChipProps, 'onPress'> & {
  onPress?: () => void;
};

// Native component declaration using the same pattern as Button
const ChipNativeView: React.ComponentType<NativeChipProps> = requireNativeView(
  'ExpoUI',
  'ChipView'
);

/**
 * Displays a native chip component.
 */
export function Chip(props: ChipProps): React.JSX.Element {
  // Min height from https://m3.material.io/components/chips/specs, minWidth
  return (
    <ChipNativeView
      {...props}
      style={StyleSheet.compose({ minWidth: 100, height: 32 }, props.style)}
    />
  );
}
