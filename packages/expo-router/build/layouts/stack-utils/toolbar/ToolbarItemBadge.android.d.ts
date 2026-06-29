import type { ReactElement, ReactNode } from 'react';
import type { NativeStackHeaderItemButton } from '../../../react-navigation/native-stack';
type ToolbarBadge = NativeStackHeaderItemButton['badge'];
/**
 * Builds the spoken description for a badged icon so TalkBack announces the
 * badge value (e.g. an unread count) alongside the label.
 */
export declare function getBadgeContentDescription(accessibilityLabel: string | undefined, badge: ToolbarBadge): string | undefined;
/**
 * Overlays a Material 3 Badge on the top-end corner of a toolbar item's icon.
 * Compose anchors a badge to a single child, so the icon is wrapped in a Box.
 * Renders the anchor unchanged when there's no badge, and a dot (no text) when
 * the badge has no value. Shared by Stack.Toolbar.Button and Stack.Toolbar.Menu.
 */
export declare function ToolbarItemBadge({ badge, disabled, children, }: {
    badge: ToolbarBadge;
    disabled?: boolean;
    children: ReactNode;
}): ReactElement;
export {};
//# sourceMappingURL=ToolbarItemBadge.android.d.ts.map