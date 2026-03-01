import { requireNativeView } from 'expo';
import React from 'react';

import { ExpoModifier } from '../../types';
import { createViewModifierEventListener } from '../modifiers/utils';

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

export interface ChipProps {
  /**
   * The variant of the chip.
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
   * Optional trailing icon name (using Material Icons). Used for assist, filter, and input chips. For input chips, defaults to `filled.Close` if not specified.
   */
  trailingIcon?: string;

  /**
   * Size of the icon in density-independent pixels (dp). Defaults to 18.
   */
  iconSize?: number;

  /**
   * Text style variant for the chip label. Defaults to `labelSmall`.
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
   * Modifiers for the component.
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

type NativeChipProps = ChipProps;
// Native component declaration using the same pattern as Button
const ChipNativeView: React.ComponentType<NativeChipProps> = requireNativeView(
  'ExpoUI',
  'ChipView'
);

function transformChipProps(props: ChipProps): NativeChipProps {
  const { modifiers, ...restProps } = props;
  return {
    modifiers,
    ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
    ...restProps,
  };
}

/**
 * Displays a native chip component.
 */
export function Chip(props: ChipProps): React.JSX.Element {
  return <ChipNativeView {...transformChipProps(props)} />;
}
