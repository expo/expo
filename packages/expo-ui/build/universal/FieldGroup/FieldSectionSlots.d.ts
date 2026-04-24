import { type ReactNode } from 'react';
/**
 * Marker component that designates its children as the header of the
 * enclosing [`FieldGroup.Section`](#fieldgroupsection). Used via the
 * compound API: `<FieldGroup.SectionHeader>…</FieldGroup.SectionHeader>`.
 * Its only job is to tag a slot — the parent `FieldGroup.Section` extracts
 * and renders the children in the header position.
 */
export declare function Header(props: {
    children?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
/**
 * Marker component that designates its children as the footer of the
 * enclosing [`FieldGroup.Section`](#fieldgroupsection). Used via the
 * compound API: `<FieldGroup.SectionFooter>…</FieldGroup.SectionFooter>`.
 * Its only job is to tag a slot — the parent `FieldGroup.Section` extracts
 * and renders the children in the footer position.
 */
export declare function Footer(props: {
    children?: ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export type ExtractedFieldSectionSlots = {
    header?: ReactNode;
    footer?: ReactNode;
    rows: ReactNode[];
};
/**
 * Walks `children`, pulls out any `<FieldGroup.SectionHeader>` /
 * `<FieldGroup.SectionFooter>` slots, and returns the remaining nodes as the
 * section's rows. Transparently recurses into `React.Fragment` so conditional
 * rendering (`<>{showHeader ? <SectionHeader>…</SectionHeader> : null}</>`)
 * works.
 */
export declare function extractFieldSectionSlots(children: ReactNode): ExtractedFieldSectionSlots;
//# sourceMappingURL=FieldSectionSlots.d.ts.map