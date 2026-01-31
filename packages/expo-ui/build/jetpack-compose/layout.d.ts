import { ExpoModifier } from '../types';
export type PrimitiveBaseProps = {
    /**
     * Modifiers for the component.
     */
    modifiers?: ExpoModifier[];
};
export type HorizontalArrangement = 'start' | 'end' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' | {
    spacedBy: number;
};
export type VerticalArrangement = 'top' | 'bottom' | 'center' | 'spaceBetween' | 'spaceAround' | 'spaceEvenly' | {
    spacedBy: number;
};
export type HorizontalAlignment = 'start' | 'end' | 'center';
export type VerticalAlignment = 'top' | 'bottom' | 'center';
export type ContentAlignment = 'topStart' | 'topCenter' | 'topEnd' | 'centerStart' | 'center' | 'centerEnd' | 'bottomStart' | 'bottomCenter' | 'bottomEnd';
export type FloatingToolbarExitAlwaysScrollBehavior = 'top' | 'bottom' | 'start' | 'end';
type LayoutBaseProps = {
    children?: React.ReactNode;
    horizontalArrangement?: HorizontalArrangement;
    verticalArrangement?: VerticalArrangement;
    horizontalAlignment?: HorizontalAlignment;
    verticalAlignment?: VerticalAlignment;
    contentAlignment?: ContentAlignment;
    floatingToolbarExitAlwaysScrollBehavior?: FloatingToolbarExitAlwaysScrollBehavior;
    modifiers?: ExpoModifier[];
} & PrimitiveBaseProps;
export type BoxProps = Pick<LayoutBaseProps, 'children' | 'modifiers' | 'contentAlignment' | 'floatingToolbarExitAlwaysScrollBehavior'>;
export declare function Box(props: BoxProps): import("react").JSX.Element;
export type RowProps = LayoutBaseProps;
export declare function Row(props: RowProps): import("react").JSX.Element;
export type FlowRowProps = Pick<LayoutBaseProps, 'children' | 'modifiers' | 'horizontalArrangement' | 'verticalArrangement'>;
export declare function FlowRow(props: FlowRowProps): import("react").JSX.Element;
export type ColumnProps = LayoutBaseProps;
export declare function Column(props: ColumnProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=layout.d.ts.map