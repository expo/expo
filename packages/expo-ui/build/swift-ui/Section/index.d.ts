import { type CommonViewModifierProps } from '../types';
export type SectionProps = {
    /**
     * On iOS, section titles are usually capitalized for consistency with platform conventions.
     */
    title?: string;
    /**
     * Sets a custom footer for the section.
     * @description If section is expanded, the footer will not be shown.
     */
    footer?: React.ReactNode;
    /**
     * Sets a custom header for the section.
     * @description This will replace the default section header with your own content.
     */
    header?: React.ReactNode;
    children: React.ReactNode;
    /**
     * Enables or disables collapsible behavior for the section.
     * @default false
     * @availability Available only when the list style is set to `sidebar`.
     */
    collapsible?: boolean;
} & CommonViewModifierProps;
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export declare function Section(props: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map