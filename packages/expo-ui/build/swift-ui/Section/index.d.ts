import { type CommonViewModifierProps } from '../types';
export type SectionProps = {
    /**
     * On iOS, section titles are usually capitalized for consistency with platform conventions.
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
    children: React.ReactNode;
    /**
     * Enables or disables collapsible behavior for the section.
     * > **Note**: Available only when the list style is set to `sidebar`.
     * @platform ios 17.0+
     * @platform tvos 17.0+
     * @default false
     */
    collapsible?: boolean;
} & CommonViewModifierProps;
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 */
export declare function Section(props: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map