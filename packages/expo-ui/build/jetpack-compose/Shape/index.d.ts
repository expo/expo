import { StyleProp } from 'react-native';
export type ShapeProps = {
    style: StyleProp<any>;
};
/**
 * @hidden
 */
export type NativeShapeProps = ShapeProps & {};
/**
 * @hidden
 */
export declare function transformShapeProps(props: ShapeProps): NativeShapeProps;
/**
 * Displays a native shape component.
 */
export declare function Shape(props: ShapeProps): import("react").JSX.Element;
//# sourceMappingURL=index.d.ts.map