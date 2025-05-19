import { ViewStyle } from 'react-native';
export type ShapeParameters = {
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
};
type StarProps = ShapeParameters & {
    type: 'STAR';
};
type PillStarProps = ShapeParameters & {
    type: 'PILL_STAR';
};
type PillProps = Pick<ShapeParameters, 'smoothing'> & {
    type: 'PILL';
};
type CircleProps = Pick<ShapeParameters, 'smoothing' | 'verticesCount'> & {
    type: 'CIRCLE';
};
type RectangleProps = Pick<ShapeParameters, 'smoothing' | 'cornerRounding'> & {
    type: 'RECTANGLE';
};
type PolygonProps = Pick<ShapeParameters, 'smoothing' | 'cornerRounding' | 'verticesCount'> & {
    type: 'POLYGON';
};
type ShapeProps = {
    style?: ViewStyle;
    color?: string;
} & (StarProps | PillStarProps | PillProps | CircleProps | RectangleProps | PolygonProps);
/**
 * Displays a native shape component.
 */
export declare function Shape(props: ShapeProps): import("react").JSX.Element;
export {};
//# sourceMappingURL=index.d.ts.map