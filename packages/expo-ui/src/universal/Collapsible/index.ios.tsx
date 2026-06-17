import { DisclosureGroup, Text } from '@expo/ui/swift-ui';

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
  ref,
}: CollapsibleProps) {
  const labelTextModifiers = labelStyle
    ? transformToModifiers(undefined, {}, undefined, { textStyle: labelStyle })
    : undefined;

  return (
    <DisclosureGroup isExpanded={isOpen} onIsExpandedChange={onOpenChange} {...{ ref }}>
      <DisclosureGroup.Label>
        <Text modifiers={labelTextModifiers}>{label}</Text>
      </DisclosureGroup.Label>
      {children}
    </DisclosureGroup>
  );
}

export * from './types';
