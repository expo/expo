import { type ColorValue } from 'react-native';
import type { ModifierConfig } from '../../types';
import { type ShapeJSXElement } from '../Shape';
/**
 * Colors for icon button elements.
 */
export type IconButtonColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    disabledContainerColor?: ColorValue;
    disabledContentColor?: ColorValue;
};
export type IconButtonProps = {
    /**
     * Callback that is called when the icon button is clicked.
     */
    onClick?: () => void;
    /**
     * Whether the icon button is enabled for user interaction.
     * @default true
     */
    enabled?: boolean;
    /**
     * Colors for icon button elements.
     * @platform android
     */
    colors?: IconButtonColors;
    /**
     * The shape of the icon button.
     */
    shape?: ShapeJSXElement;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Content to display inside the icon button.
     */
    children: React.ReactNode;
};
/**
 * A standard icon button with no background.
 */
export declare const IconButton: {
    (props: IconButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * A filled icon button with a solid background.
 */
export declare const FilledIconButton: {
    (props: IconButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * A filled tonal icon button with a muted background.
 */
export declare const FilledTonalIconButton: {
    (props: IconButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * An outlined icon button with a border and no fill.
 */
export declare const OutlinedIconButton: {
    (props: IconButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
//# sourceMappingURL=index.d.ts.map