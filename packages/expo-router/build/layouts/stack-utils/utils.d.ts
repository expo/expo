import { type ReactElement } from 'react';
import { type StyleProp, type TextStyle } from 'react-native';
export declare function isChildOfType<PropsT>(element: React.ReactNode, type: (props: PropsT) => unknown): element is ReactElement<PropsT>;
export declare function getFirstChildOfType<PropsT>(children: React.ReactNode | React.ReactNode[], type: (props: PropsT) => unknown): ReactElement<PropsT, string | import("react").JSXElementConstructor<any>> | undefined;
type NumericFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type ConvertedFontWeightType = Exclude<TextStyle['fontWeight'], number> | `${NumericFontWeight}`;
export declare function convertTextStyleToRNTextStyle<BaseStyleType extends Pick<TextStyle, 'fontWeight'>>(style: StyleProp<BaseStyleType | undefined>): (Omit<BaseStyleType, 'fontWeight'> & {
    fontWeight?: ConvertedFontWeightType;
}) | undefined;
export {};
//# sourceMappingURL=utils.d.ts.map