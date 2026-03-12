import { type ColorValue } from 'react-native';
import { type ModifierConfig, ViewEvent } from '../../types';
import { ShapeJSXElement, ShapeRecordProps } from '../Shape';
/**
 * Colors for button elements.
 * @platform android
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
     * @platform android
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
    children?: React.ReactNode;
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
 * @platform android
 */
export declare function Button(props: ButtonProps): import("react").JSX.Element;
/**
 * A filled tonal button component.
 * @platform android
 */
export declare function FilledTonalButton(props: ButtonProps): import("react").JSX.Element;
/**
 * An outlined button component.
 * @platform android
 */
export declare function OutlinedButton(props: ButtonProps): import("react").JSX.Element;
/**
 * An elevated button component.
 * @platform android
 */
export declare function ElevatedButton(props: ButtonProps): import("react").JSX.Element;
/**
 * A text button component.
 * @platform android
 */
export declare function TextButton(props: ButtonProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map