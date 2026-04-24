import { Section } from '@expo/ui/swift-ui';

import { extractFieldSectionSlots } from './FieldSectionSlots';
import type { FieldSectionProps } from './types';
import { transformToModifiers } from '../transformStyle';

/**
 * iOS implementation of [`FieldGroup.Section`](#fieldgroupsection). Extracts
 * the `<FieldGroup.SectionHeader>` / `<FieldGroup.SectionFooter>` slot
 * children and forwards them to SwiftUI's native
 * [`Section`](https://developer.apple.com/documentation/swiftui/section),
 * which handles row layout, dividers, and grouped-inset styling.
 */
export function FieldSection({
  children,
  title,
  style,
  onAppear,
  onDisappear,
  disabled,
  hidden,
  testID,
  modifiers: extraModifiers,
}: FieldSectionProps) {
  const { header, footer, rows } = extractFieldSectionSlots(children);

  const modifiers = transformToModifiers(
    style,
    { onAppear, onDisappear, disabled, hidden, testID },
    extraModifiers
  );

  return (
    <Section
      title={header ? undefined : title}
      header={header}
      footer={footer}
      modifiers={modifiers}>
      {rows}
    </Section>
  );
}
