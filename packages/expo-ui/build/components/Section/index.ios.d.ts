import { StyleProp, ViewStyle } from 'react-native';
export type SectionProps = {
    /**
     * @note On iOS, section titles are usually capitalized for consistency with platform conventions.
     */
    title: string;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
};
export declare function Section(props: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=index.ios.d.ts.map