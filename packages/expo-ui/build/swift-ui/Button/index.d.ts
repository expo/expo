import { type SFSymbol } from 'sf-symbols-typescript';
import { type CommonViewModifierProps } from '../types';
/**
 * The role of the button.
 * - `default` - The default button role.
 * - `cancel` - A button that cancels the current operation.
 * - `destructive` - A button that deletes data or performs a destructive action.
 */
export type ButtonRole = 'default' | 'cancel' | 'destructive';
export type ButtonProps = {
    /**
     * A callback that is called when the button is pressed.
     */
    onPress?: () => void;
    /**
     * A string describing the system image to display in the button.
     * Only used when `label` is provided.
     */
    systemImage?: SFSymbol;
    /**
     * Indicates the role of the button.
     */
    role?: ButtonRole;
    /**
     * The text label for the button. Use this for simple text buttons.
     */
    label?: string;
    /**
     * Custom content for the button label. Use this for custom label views.
     */
    children?: React.ReactNode;
} & CommonViewModifierProps;
/**
 * Displays a native button component.
 *
 * @example
 * ```tsx
 * import { Button } from '@expo/ui/swift-ui';
 * import { buttonStyle, controlSize, tint, disabled } from '@expo/ui/swift-ui/modifiers';
 *
 * <Button
 *   role="destructive"
 *   onPress={handlePress}
 *   label="Delete"
 *   modifiers={[
 *     buttonStyle('bordered'),
 *     controlSize('large'),
 *     tint('#FF0000'),
 *     disabled(true)
 *   ]}
 * />
 * ```
 */
export declare function Button(props: ButtonProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map