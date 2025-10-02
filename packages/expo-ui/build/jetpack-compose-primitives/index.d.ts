import { ColorValue, StyleProp, ViewStyle } from 'react-native';
import { ExpoModifier } from '../types';
type PrimitiveBaseProps = {
    /**
     * Used to locate this view in end-to-end tests.
     */
    testID?: string;
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
} & PrimitiveBaseProps;
export type RowProps = LayoutBaseProps;
export declare function Row(props: RowProps): import("react").JSX.Element | null;
export type ColumnProps = LayoutBaseProps;
export declare function Column(props: ColumnProps): import("react").JSX.Element | null;
export type HostProps = {
    children: React.ReactNode;
    style?: StyleProp<ViewStyle>;
} & PrimitiveBaseProps;
export declare function Host(props: HostProps): import("react").JSX.Element | null;
export type TextFontWeight = 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
export type TextProps = {
    children: string;
    color?: ColorValue;
    fontSize?: number;
    fontWeight?: TextFontWeight;
} & PrimitiveBaseProps;
export declare function Text(props: TextProps): import("react").JSX.Element | null;
export {};
//# sourceMappingURL=index.d.ts.map