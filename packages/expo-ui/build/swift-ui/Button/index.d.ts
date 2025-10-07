import { type SFSymbol } from 'sf-symbols-typescript';
import { type ViewEvent } from '../../types';
import { type CommonViewModifierProps } from '../types';
/**
 * The role of the button.
 * - `default` - The default button role.
 * - `cancel` - A button that cancels the current operation.
 * - `destructive` - A button that deletes data or performs a destructive action.
 */
export type ButtonRole = 'default' | 'cancel' | 'destructive';
/**
 * Sets the size for controls within this view.
 * - `mini` - A control version that is minimally sized.
 * - `small` - A control version that is proportionally smaller size for space-constrained views.
 * - `regular` - A control version that is the default size.
 * - `large` - A control version that is prominently sized.
 * - `extraLarge` - A control version that is substantially sized. The largest control size. Resolves to ControlSize.large on platforms other than visionOS.
 */
export type ButtonControlSize = 'mini' | 'small' | 'regular' | 'large' | 'extraLarge';
/**
 * The built-in button styles available on iOS.
 *
 * Common styles:
 * - `default` - The default system button style.
 * - `bordered` - A button with a light fill. On Android, equivalent to `FilledTonalButton`.
 * - `borderless` - A button with no background or border. On Android, equivalent to `TextButton`.
 * - `borderedProminent` - A bordered button with a prominent appearance.
 * - `plain` - A button with no border or background and a less prominent text.
 * - `glass` – A liquid glass button effect – (available only from iOS 26, when built with Xcode 26)
 * - `glassProminent` – A liquid glass button effect – (available only from iOS 26, when built with Xcode 26)
 * macOS-only styles:
 * - `accessoryBar` - A button style for accessory bars.
 * - `accessoryBarAction` - A button style for accessory bar actions.
 * - `card` - A button style for cards.
 * - `link` - A button style for links.
 */
export type ButtonVariant = 'default' | 'bordered' | 'plain' | 'glass' | 'glassProminent' | 'borderedProminent' | 'borderless' | 'accessoryBar' | 'accessoryBarAction' | 'card' | 'link';
export type ButtonProps = {
    /**
     * A callback that is called when the button is pressed.
     */
    onPress?: () => void;
    /**
     * A string describing the system image to display in the button.
     * This is only used if `children` is a string.
     * Uses SF Symbols.
     */
    systemImage?: SFSymbol;
    /**
     * Indicated the role of the button.
     * @platform ios
     */
    role?: ButtonRole;
    /**
     * The size for controls within this view.
     */
    controlSize?: ButtonControlSize;
    /**
     * The button variant.
     */
    variant?: ButtonVariant;
    /**
     * The text or React node to display inside the button.
     */
    children?: string | React.ReactNode;
    /**
     * Button color.
     */
    color?: string;
    /**
     * Disabled state of the button.
     */
    disabled?: boolean;
} & CommonViewModifierProps;
/**
 * exposed for ContextMenu
 * @hidden
 */
export type NativeButtonProps = Omit<ButtonProps, 'role' | 'onPress' | 'children' | 'systemImage' | 'controlSize'> & {
    buttonRole?: ButtonRole;
    text: string | undefined;
    systemImage?: SFSymbol;
} & ViewEvent<'onButtonPressed', void>;
/**
 * exposed for ContextMenu
 * @hidden
 */
export declare function transformButtonProps(props: Omit<ButtonProps, 'children'>, text: string | undefined): NativeButtonProps;
/**
 * Displays a native button component.
 */
export declare function Button(props: ButtonProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map