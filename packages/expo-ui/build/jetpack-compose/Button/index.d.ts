import { type ColorValue } from 'react-native';
import type { ModifierConfig, ViewEvent } from '../../types';
import { type ShapeJSXElement, type ShapeRecordProps } from '../Shape';
/**
 * Colors for button elements.
 */
export type ButtonColors = {
    containerColor?: ColorValue;
    contentColor?: ColorValue;
    disabledContainerColor?: ColorValue;
    disabledContentColor?: ColorValue;
};
/**
 * Content padding for the button's inner content.
 * All values are in density-independent pixels (dp).
 */
export type ButtonContentPadding = {
    start?: number;
    top?: number;
    end?: number;
    bottom?: number;
};
export type ButtonProps = {
    /**
     * Callback that is called when the button is clicked.
     */
    onClick?: () => void;
    /**
     * Whether the button is enabled for user interaction.
     * @default true
     */
    enabled?: boolean;
    /**
     * Colors for button elements.
     */
    colors?: ButtonColors;
    /**
     * The padding between the button container and its content.
     * Use this to adjust internal spacing, for example when adding a leading icon
     */
    contentPadding?: ButtonContentPadding;
    /**
     * The shape of the button.
     */
    shape?: ShapeJSXElement;
    /**
     * Modifiers for the component.
     */
    modifiers?: ModifierConfig[];
    /**
     * Content to display inside the button.
     */
    children: React.ReactNode;
};
type NativeButtonProps = Omit<ButtonProps, 'onClick' | 'shape' | 'children'> & {
    shape?: ShapeRecordProps;
    children?: React.ReactNode;
} & ViewEvent<'onButtonPressed', void>;
/**
 * @hidden
 */
export declare function transformButtonProps(props: Omit<ButtonProps, 'children'>): NativeButtonProps;
/**
 * A filled button component.
 */
export declare const Button: {
    (props: ButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * A filled tonal button component.
 */
export declare const FilledTonalButton: {
    (props: ButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * An outlined button component.
 */
export declare const OutlinedButton: {
    (props: ButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * An elevated button component.
 */
export declare const ElevatedButton: {
    (props: ButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
/**
 * A text button component.
 */
export declare const TextButton: {
    (props: ButtonProps): import("react/jsx-runtime").JSX.Element;
    displayName: string;
};
export {};
//# sourceMappingURL=index.d.ts.map