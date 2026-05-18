import type { UniversalBaseProps } from '../types';
/**
 * Visual variant of a [`Button`](#button).
 *
 * - `'filled'` — solid background color (default).
 * - `'outlined'` — transparent background with a border.
 * - `'text'` — no background or border, text only.
 */
export type ButtonVariant = 'filled' | 'outlined' | 'text';
/**
 * Props for the [`Button`](#button) component.
 */
export interface ButtonProps extends UniversalBaseProps {
    /**
     * Custom content rendered inside the button. When provided, `label` is ignored.
     */
    children?: React.ReactNode;
    /**
     * Text label displayed inside the button. Ignored when `children` is provided.
     */
    label?: string;
    /**
     * Called when the button is pressed.
     */
    onPress?: () => void;
    /**
     * Visual variant of the button.
     * @default 'filled'
     */
    variant?: ButtonVariant;
}
//# sourceMappingURL=types.d.ts.map