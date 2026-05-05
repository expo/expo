import { type CommonViewModifierProps } from '../types';
export type LinkProps = {
    /**
     * The text label for the Link. Use this for simple text links.
     */
    label?: string;
    /**
     * The URL for the link.
     */
    destination: string;
    /**
     * Custom content for the link label. Use this for custom label views.
     * Only nested elements are supported, not plain strings.
     */
    children?: React.ReactElement | React.ReactElement[];
} & CommonViewModifierProps;
/**
 * Displays a native link component.
 *
 * @example
 * ```tsx
 * import { Link } from '@expo/ui/swift-ui';
 * import { foregroundStyle, font } from '@expo/ui/swift-ui/modifiers';
 *
 * <Link
 *   label="Open"
 *   destination="https://expo.dev"
 *   modifiers={[
 *     foregroundStyle('red'),
 *     font({ size: 24, weight: 'bold' })
 *   ]}
 * />
 * ```
 */
export declare function Link(props: LinkProps): import("react/jsx-runtime").JSX.Element;
//# sourceMappingURL=index.d.ts.map