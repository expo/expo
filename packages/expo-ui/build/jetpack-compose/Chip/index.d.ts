import React from 'react';
import { ViewProps } from 'react-native';
import { ExpoModifier } from '../../types';
/**
 * Available text style variants for chip labels.
 */
export type ChipTextStyle = 'labelSmall' | 'labelMedium' | 'labelLarge' | 'bodySmall' | 'bodyMedium' | 'bodyLarge';
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
/**
 * @hidden
 */
export declare function transformChipProps(props: ChipProps): ChipProps;
/**
 * Displays a native chip component.
 */
export declare function Chip(props: ChipProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map