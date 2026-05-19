import { DisclosureGroup } from '@expo/ui/swift-ui';

import type { CollapsibleProps } from './types';

/**
 * iOS implementation of `Collapsible`. Wraps SwiftUI's `DisclosureGroup`.
 */
export function Collapsible({ isOpen, onOpenChange, label = '', children }: CollapsibleProps) {
  return (
    <DisclosureGroup label={label} isExpanded={isOpen} onIsExpandedChange={onOpenChange}>
      {children}
    </DisclosureGroup>
  );
}

export * from './types';
