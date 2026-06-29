import type { ReactNode } from 'react';
import type { NativeStackHeaderItemButton } from '../../../react-navigation/native-stack';
type ToolbarBadge = NativeStackHeaderItemButton['badge'];
export declare function getBadgeContentDescription(_accessibilityLabel: string | undefined, _badge: ToolbarBadge): string | undefined;
export declare function ToolbarItemBadge(_props: {
    badge: ToolbarBadge;
    disabled?: boolean;
    children: ReactNode;
}): null;
export {};
//# sourceMappingURL=ToolbarItemBadge.d.ts.map