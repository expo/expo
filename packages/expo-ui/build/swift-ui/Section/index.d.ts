import { StyleProp, ViewStyle } from 'react-native';
export type SectionProps = {
    /**
     * On iOS, section titles are usually capitalized for consistency with platform conventions.
     */
    title?: string;
    children: any;
    style?: StyleProp<ViewStyle>;
};
/**
 * Section component uses the native [Section](https://developer.apple.com/documentation/swiftui/section) component.
 * It has no intrinsic dimensions, so it needs explicit height or flex set to display content (like ScrollView).
 * @platform ios
 */
export declare function Section(props: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map