import { type CommonViewModifierProps } from '../types';
export type SectionProps = {
    /**
     * On iOS, section titles are usually capitalized for consistency with platform conventions.
     */
    title?: string;
    /**
     * Sets the section footer text.
     * @description If section is expanded, the footer will not be shown.
     */
    footer?: string;
    children: React.ReactNode;
    /**
     * Enables or disables collapsible behavior for the section.
     * @default false
     * @availability Available only when the list style is set to `sidebar`.
     */
    collapsible?: boolean;
} & CommonViewModifierProps;
/**
 * The view displayed at the top of a section.
 *
 * @example
 * ```tsx
 * <Section.Header>Settings</Section.Header>
 * ```
 *
 * @platform ios
 */
export declare function Header(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * The view displayed at the bottom of a section.
 *
 * @example
 * ```tsx
 * <Section.Footer>Additional details</Section.Footer>
 * ```
 *
 * @platform ios
 */
export declare function Footer(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * The main content area of the section.
 *
 * @example
 * ```tsx
 * <Section.Content>
 *   <Text>Option 1</Text>
 *   <Text>Option 2</Text>
 * </Section.Content>
 * ```
 *
 * @platform ios
 */
export declare function Content(props: {
    children: React.ReactNode;
}): import("react").JSX.Element;
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export declare function Section(props: SectionProps): import("react").JSX.Element;
export declare namespace Section {
    var Header: typeof import(".").Header;
    var Footer: typeof import(".").Footer;
    var Content: typeof import(".").Content;
}
//# sourceMappingURL=index.d.ts.map