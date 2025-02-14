import { StyleProp, ViewStyle } from 'react-native';
export type SectionProps = {
    title: string;
    /**
     *  Option to display the title in lower case letters
     * @default true
     */
    displayTitleUppercase: boolean;
    style?: StyleProp<ViewStyle>;
    children: React.ReactNode;
};
export declare function Section(props: SectionProps): import("react").JSX.Element;
//# sourceMappingURL=index.ios.d.ts.map