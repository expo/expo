import { Children, Fragment, isValidElement, type ReactNode } from 'react';

/**
 * Marker component that designates its children as the header of the
 * enclosing [`FieldGroup.Section`](#fieldgroupsection). Used via the
 * compound API: `<FieldGroup.SectionHeader>…</FieldGroup.SectionHeader>`.
 * Its only job is to tag a slot — the parent `FieldGroup.Section` extracts
 * and renders the children in the header position.
 */
export function Header(props: { children?: ReactNode }) {
  return <>{props.children}</>;
}

/**
 * Marker component that designates its children as the footer of the
 * enclosing [`FieldGroup.Section`](#fieldgroupsection). Used via the
 * compound API: `<FieldGroup.SectionFooter>…</FieldGroup.SectionFooter>`.
 * Its only job is to tag a slot — the parent `FieldGroup.Section` extracts
 * and renders the children in the footer position.
 */
export function Footer(props: { children?: ReactNode }) {
  return <>{props.children}</>;
}

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
export function extractFieldSectionSlots(children: ReactNode): ExtractedFieldSectionSlots {
  let header: ReactNode | undefined;
  let footer: ReactNode | undefined;
  const rows: ReactNode[] = [];

  const walk = (node: ReactNode) => {
    Children.forEach(node, (child) => {
      if (!isValidElement(child)) {
        rows.push(child);
        return;
      }
      if (child.type === Header) {
        header = (child.props as { children?: ReactNode }).children;
        return;
      }
      if (child.type === Footer) {
        footer = (child.props as { children?: ReactNode }).children;
        return;
      }
      if (child.type === Fragment) {
        walk((child.props as { children?: ReactNode }).children);
        return;
      }
      rows.push(child);
    });
  };

  walk(children);
  return { header, footer, rows };
}
