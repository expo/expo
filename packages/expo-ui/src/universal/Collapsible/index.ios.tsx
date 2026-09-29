import { DisclosureGroup, Text } from '@expo/ui/swift-ui';

import { EnsureHost, intrinsicHostOptions } from '../autoHost';
import { transformToModifiers } from '../transformStyle';
import type { CollapsibleProps } from './types';

/**
 * iOS implementation of `Collapsible`. Wraps SwiftUI's `DisclosureGroup`.
 */
export function Collapsible({
  isOpen,
  onOpenChange,
  label = '',
  labelStyle,
  children,
}: CollapsibleProps) {
  const labelTextModifiers = labelStyle
    ? transformToModifiers(undefined, {}, undefined, { textStyle: labelStyle })
    : undefined;

  return (
    <EnsureHost {...intrinsicHostOptions}>
      <DisclosureGroup isExpanded={isOpen} onIsExpandedChange={onOpenChange}>
        <DisclosureGroup.Label>
          <Text modifiers={labelTextModifiers}>{label}</Text>
        </DisclosureGroup.Label>
        {children}
      </DisclosureGroup>
    </EnsureHost>
  );
}

export * from './types';
