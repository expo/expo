import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
export type SectionProps = {
    style?: StyleProp<ViewStyle>;
    title: string;
    /**
     *  Option to display the title in lower case letters
     * @default true
     */
    displayTitleUppercase: boolean;
    children: React.ReactNode;
};
export declare function Section(props: SectionProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map