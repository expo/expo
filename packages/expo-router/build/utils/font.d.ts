import { type StyleProp, type TextStyle } from 'react-native';
type NumericFontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type ConvertedFontWeightType = Exclude<TextStyle['fontWeight'], number> | `${NumericFontWeight}`;
export declare function convertTextStyleToRNTextStyle<BaseStyleType extends Pick<TextStyle, 'fontWeight'>>(style: StyleProp<BaseStyleType | undefined>): (Omit<BaseStyleType, 'fontWeight'> & {
    fontWeight?: ConvertedFontWeightType;
}) | undefined;
export type BasicTextStyle = Pick<TextStyle, 'fontSize' | 'fontWeight' | 'fontFamily' | 'color'>;
export {};
//# sourceMappingURL=font.d.ts.map