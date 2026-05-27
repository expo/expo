import type { UniversalTextStyle } from '../Text/types';
/**
 * Props for the [`Collapsible`](#collapsible) component, a primitive that
 * shows or hides its content with a tap on a labelled header.
 */
export interface CollapsibleProps {
    /**
     * Whether the content is currently expanded.
     */
    isOpen: boolean;
    /**
     * Called when the user taps the header to toggle the open state.
     */
    onOpenChange: (isOpen: boolean) => void;
    /**
     * Text rendered in the tappable header.
     */
    label?: string;
    /**
     * Text-specific styling for the tappable header label.
     */
    labelStyle?: UniversalTextStyle;
    /**
     * Content rendered when `isOpen` is `true`.
     */
    children?: React.ReactNode;
}
//# sourceMappingURL=types.d.ts.map