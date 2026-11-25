import type { ReactNode } from 'react';

import type { NativeStackHeaderItemButton } from '../../../react-navigation/native-stack';

type ToolbarBadge = NativeStackHeaderItemButton['badge'];

// Toolbar badges are only rendered through Jetpack Compose on Android
// (see ToolbarItemBadge.android.tsx). On other platforms these are no-ops —
// iOS badge support flows through native header items instead.

export function getBadgeContentDescription(
  _accessibilityLabel: string | undefined,
  _badge: ToolbarBadge
): string | undefined {
  return undefined;
}

export function ToolbarItemBadge(_props: {
  badge: ToolbarBadge;
  disabled?: boolean;
  children: ReactNode;
}): null {
  return null;
}
