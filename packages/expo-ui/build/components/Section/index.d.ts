import * as React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
export type SectionProps = {
    style?: StyleProp<ViewStyle>;
    /**
    * @note On iOS, section titles are usually capitalized for consistency with platform conventions.
    */
    title: string;
    children: any;
};
export declare function Section({ title, children, style }: SectionProps): React.JSX.Element;
//# sourceMappingURL=index.d.ts.map