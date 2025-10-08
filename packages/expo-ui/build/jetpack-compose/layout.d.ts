import { ColorValue } from 'react-native';
import { ExpoModifier } from '../types';
export type PrimitiveBaseProps = {
    /** Modifiers for the component */
    modifiers?: ExpoModifier[];
};
export type HorizontalArrangement = 'start' | 'end' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
export type VerticalArrangement = 'top' | 'bottom' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly';
export type HorizontalAlignment = 'start' | 'end' | 'center';
export type VerticalAlignment = 'top' | 'bottom' | 'center';
type LayoutBaseProps = {
    children?: React.ReactNode;
    horizontalArrangement?: HorizontalArrangement;
    verticalArrangement?: VerticalArrangement;
    horizontalAlignment?: HorizontalAlignment;
    verticalAlignment?: VerticalAlignment;
    modifiers?: ExpoModifier[];
} & PrimitiveBaseProps;
export type BoxProps = Pick<LayoutBaseProps, 'children' | 'modifiers'>;
export declare function Box(props: BoxProps): import("react").JSX.Element | null;
export type RowProps = LayoutBaseProps;
export declare function Row(props: RowProps): import("react").JSX.Element | null;
export type ColumnProps = LayoutBaseProps;
export declare function Column(props: ColumnProps): import("react").JSX.Element | null;
export type TextFontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type TextProps = {
    children: string;
    color?: ColorValue;
    fontSize?: number;
    fontWeight?: TextFontWeight;
} & PrimitiveBaseProps;
export declare function Text(props: TextProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=layout.d.ts.map