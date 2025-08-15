import type { ImageSourcePropType } from 'react-native';
import type { SFSymbol } from 'sf-symbols-typescript';
export interface LabelProps {
    /**
     * The text to display as the label for the tab.
     */
    children?: string;
    /**
     * If true, the label will be hidden.
     * @default false
     */
    hidden?: boolean;
}
export declare function Label(props: LabelProps): null;
export interface SourceIconCombination {
    /**
     * The image source to use as an icon.
     * @platform iOS
     */
    src?: ImageSourcePropType;
    /**
     * The image source to use as an icon when the tab is selected.
     * @platform iOS
     */
    selectedSrc?: ImageSourcePropType;
    /**
     * The name of the drawable resource to use as an icon.
     * @platform android
     */
    drawable?: string;
    sf?: never;
    selectedSf?: never;
}
export interface NamedIconCombination {
    /**
     * The name of the SF Symbol to use as an icon.
     * @platform iOS
     */
    sf?: SFSymbol;
    /**
     * The name of the SF Symbol to use as an icon when the tab is selected.
     * @platform iOS
     */
    selectedSf?: SFSymbol;
    /**
     * The name of the drawable resource to use as an icon.
     * @platform android
     */
    drawable?: string;
    src?: never;
    selectedSrc?: never;
}
export type IconProps = NamedIconCombination | SourceIconCombination;
/**
 * Renders an icon for the tab.
 *
 * @platform ios
 * @platform android
 */
export declare function Icon(props: IconProps): null;
export interface BadgeProps {
    /**
     * The text to display as the badge for the tab.
     * If not provided, the badge will not be displayed.
     */
    children?: string;
    /**
     * If true, the badge will be hidden.
     * @default false
     */
    hidden?: boolean;
}
export declare function Badge(props: BadgeProps): null;
//# sourceMappingURL=elements.d.ts.map