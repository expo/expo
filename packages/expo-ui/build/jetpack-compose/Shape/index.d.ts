import { ViewStyle } from 'react-native';
import { ExpoModifier } from '../../types';
export type ShapeProps = {
    /**
     * Corner rounding percentage. Multiplied by the shorter dimension of the view to produce pixel values.
     * @default 0.0
     */
    cornerRounding?: number;
    /**
     * Number between `0.0` and `1.0` that determines how much each line between vertices is "smoothed".
     * @default 0.0
     */
    smoothing?: number;
    /**
     * Number of vertices. For `'POLYGON'` it must be at least `3.0`. For `'STAR'` and `'PILL_STAR'` it is a number of vertices for each of two radii (A 5-pointed star has 10 vertices.)
     * @default 6.0
     */
    verticesCount?: number;
    /**
     * Inner radius of star-related shapes (`'STAR'` and `'PILL_STAR'`). Multiplied by the shorter dimension of the view to produce pixel values.
     * @default 1.0
     */
    innerRadius?: number;
    /**
     * Radius of the circular shape. Multiplied by the shorter dimension of the view to produce pixel values.
     * @default 1.0
     */
    radius?: number;
    /** Style of the component */
    style?: ViewStyle;
    /** Color of the shape */
    color?: string;
    /** Modifiers for the component */
    modifiers?: ExpoModifier[];
};
declare function Star(props: ShapeProps): import("react").JSX.Element;
declare function PillStar(props: ShapeProps): import("react").JSX.Element;
declare function Pill(props: Pick<ShapeProps, 'smoothing' | 'style' | 'color'>): import("react").JSX.Element;
declare function Circle(props: Pick<ShapeProps, 'radius' | 'verticesCount' | 'style' | 'color'>): import("react").JSX.Element;
declare function Rectangle(props: Pick<ShapeProps, 'smoothing' | 'cornerRounding' | 'style' | 'color'>): import("react").JSX.Element;
declare function Polygon(props: Pick<ShapeProps, 'smoothing' | 'cornerRounding' | 'verticesCount' | 'style' | 'color' | 'modifiers'>): import("react").JSX.Element;
export declare const Shape: {
    Star: typeof Star;
    PillStar: typeof PillStar;
    Pill: typeof Pill;
    Circle: typeof Circle;
    Rectangle: typeof Rectangle;
    Polygon: typeof Polygon;
};
export {};
//# sourceMappingURL=index.d.ts.map