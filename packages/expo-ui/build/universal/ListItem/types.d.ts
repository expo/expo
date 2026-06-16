import type { ReactNode, Ref } from 'react';
/**
 * Props for the [`ListItem.Leading`](#listitemleading) slot marker.
 */
export interface ListItemLeadingProps {
    /** Content rendered in the leading (start) slot. */
    children?: ReactNode;
}
/**
 * Props for the [`ListItem.Trailing`](#listitemtrailing) slot marker.
 */
export interface ListItemTrailingProps {
    /** Content rendered in the trailing (end) slot. */
    children?: ReactNode;
}
/**
 * Props for the [`ListItem.Supporting`](#listitemsupporting) slot marker.
 */
export interface ListItemSupportingProps {
    /** Content rendered below the headline. */
    children?: ReactNode;
}
/**
 * Props for the [`ListItem`](#listitem) component.
 * A tappable row in a list.
 */
export interface ListItemProps {
    /**
     * Headline content of the row.
     * The remaining (non-slot) children are rendered in the headline area.
     */
    children?: ReactNode;
    /**
     * Tap handler.
     * Activates over the entire row rectangle, including the empty gap between leading/headline/trailing.
     */
    onPress?: () => void;
    /**
     * Shorthand for the leading slot.
     * Overridden by `<ListItem.Leading>` if both are provided.
     */
    leading?: ReactNode;
    /**
     * Shorthand for the trailing slot.
     * Overridden by `<ListItem.Trailing>` if both are provided.
     */
    trailing?: ReactNode;
    /**
     * Shorthand for the supporting (sub-)text slot.
     * Strings are rendered with platform-appropriate secondary styling; pass a `ReactNode` for richer content.
     * Overridden by `<ListItem.Supporting>` if both are provided.
     */
    supportingText?: string | ReactNode;
    /**
     * Identifier used to locate the component in end-to-end tests.
     */
    testID?: string;
    /**
     * Forwarded to the underlying native view: the SwiftUI view on iOS, the Jetpack
     * Compose view on Android, or the rendered React Native element on web. An escape
     * hatch for advanced cases that need the native handle; not part of the public API.
     * @hidden
     */
    ref?: Ref<any>;
}
//# sourceMappingURL=types.d.ts.map