import { type CommonViewModifierProps } from '../types';
export type SectionProps = {
    /**
     * The title of the section.
     */
    title?: string;
    /**
     * Sets a custom footer for the section.
     */
    footer?: React.ReactNode;
    /**
     * Sets a custom header for the section.
     */
    header?: React.ReactNode;
    /**
     * The content of the section.
     */
    children: React.ReactNode;
    /**
     * Controls whether the section is expanded or collapsed.
     * When provided, the section becomes collapsible.
     * > **Note**: Available only when the list style is set to `sidebar`.
     * @platform ios 17.0+
     * @platform tvos 17.0+
     */
    isExpanded?: boolean;
    /**
     * Callback triggered when the section's expanded state changes.
     * @platform ios 17.0+
     * @platform tvos 17.0+
     */
    onIsExpandedChange?: (isExpanded: boolean) => void;
} & CommonViewModifierProps;
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 */
export declare function Section(props: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map