import type { UniversalBaseProps } from '../types';
/**
 * Props for the [`FieldGroup`](#fieldgroup) component, a scrollable container
 * of grouped settings-style rows.
 */
export interface FieldGroupProps extends UniversalBaseProps {
    /**
     * A collection of [`FieldGroup.Section`](#fieldgroupsection) components that
     * make up the group. Non-section children are rendered inline between
     * sections, matching SwiftUI `Form` behavior.
     */
    children?: React.ReactNode;
}
/**
 * Props for the [`FieldGroup.Section`](#fieldgroupsection) component, a
 * grouped list of rows within a [`FieldGroup`](#fieldgroup).
 */
export interface FieldSectionProps extends UniversalBaseProps {
    /**
     * The rows of the section, optionally interleaved with a single
     * `<FieldGroup.SectionHeader>` and/or `<FieldGroup.SectionFooter>` child
     * to customize the header / footer slots.
     */
    children?: React.ReactNode;
    /**
     * A plain-text section title, rendered as the default styled header above
     * the group. Ignored when a `<FieldGroup.SectionHeader>` child is
     * provided.
     */
    title?: string;
    /**
     * Whether the default `title` header is rendered in uppercase. Ignored when
     * a `<FieldGroup.SectionHeader>` child is provided, and ignored on iOS
     * (SwiftUI `Form` decides the header case based on the list style).
     *
     * @default false
     */
    titleUppercase?: boolean;
}
/**
 * Position of a row within a [`FieldGroup.Section`](#fieldgroupsection), used
 * to compute grouped-list corner radii.
 */
export type FieldItemPosition = 'leading' | 'middle' | 'trailing' | 'only';
/**
 * Computes the position of a row given its index within a section of
 * `total` rows.
 */
export declare function getFieldItemPosition(index: number, total: number): FieldItemPosition;
//# sourceMappingURL=types.d.ts.map