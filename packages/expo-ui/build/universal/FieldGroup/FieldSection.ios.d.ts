import type { FieldSectionProps } from './types';
/**
 * iOS implementation of [`FieldGroup.Section`](#fieldgroupsection). Extracts
 * the `<FieldGroup.SectionHeader>` / `<FieldGroup.SectionFooter>` slot
 * children and forwards them to SwiftUI's native
 * [`Section`](https://developer.apple.com/documentation/swiftui/section),
 * which handles row layout, dividers, and grouped-inset styling.
 */
export declare function FieldSection({ children, title, style, onAppear, onDisappear, disabled, hidden, testID, modifiers: extraModifiers, }: FieldSectionProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=FieldSection.ios.d.ts.map