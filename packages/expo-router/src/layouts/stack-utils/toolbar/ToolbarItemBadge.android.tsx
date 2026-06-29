'use client';
import { Badge, Box, Text as ComposeText } from '@expo/ui/jetpack-compose';
import { alpha as alphaModifier } from '@expo/ui/jetpack-compose/modifiers';
import type { ReactElement, ReactNode } from 'react';

import type { NativeStackHeaderItemButton } from '../../../react-navigation/native-stack';
import { convertFontWeightToComposeFontWeight } from '../../../utils/font';

type ToolbarBadge = NativeStackHeaderItemButton['badge'];

/** A badge shows text when its value is neither null nor empty; otherwise it's a bare dot. */
function badgeHasValue(badge: ToolbarBadge): badge is NonNullable<ToolbarBadge> {
  return badge?.value != null && badge.value !== '';
}

/**
 * Builds the spoken description for a badged icon so TalkBack announces the
 * badge value (e.g. an unread count) alongside the label.
 */
export function getBadgeContentDescription(
  accessibilityLabel: string | undefined,
  badge: ToolbarBadge
): string | undefined {
  if (!accessibilityLabel) {
    return undefined;
  }
  return badgeHasValue(badge) ? `${accessibilityLabel}, ${badge.value}` : accessibilityLabel;
}

/**
 * Overlays a Material 3 Badge on the top-end corner of a toolbar item's icon.
 * Compose anchors a badge to a single child, so the icon is wrapped in a Box.
 * Renders the anchor unchanged when there's no badge, and a dot (no text) when
 * the badge has no value. Shared by Stack.Toolbar.Button and Stack.Toolbar.Menu.
 */
export function ToolbarItemBadge({
  badge,
  disabled,
  children,
}: {
  badge: ToolbarBadge;
  disabled?: boolean;
  children: ReactNode;
}): ReactElement {
  if (!badge) {
    return <>{children}</>;
  }
  return (
    <Box contentAlignment="topEnd">
      {children}
      <Badge
        containerColor={badge.style?.backgroundColor}
        contentColor={badge.style?.color}
        modifiers={disabled ? [alphaModifier(0.38)] : undefined}>
        {badgeHasValue(badge) ? (
          <ComposeText
            style={{
              typography: 'labelSmall',
              fontWeight: convertFontWeightToComposeFontWeight(badge.style?.fontWeight),
              fontSize: badge.style?.fontSize,
              fontFamily: badge.style?.fontFamily,
            }}>
            {String(badge.value)}
          </ComposeText>
        ) : null}
      </Badge>
    </Box>
  );
}
