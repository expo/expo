import { requireNativeView } from 'expo';
import { type ColorValue } from 'react-native';

import { ExpoModifier } from '../../types';

type ShapeType = 'star' | 'pillStar' | 'pill' | 'circle' | 'rectangle' | 'polygon';

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
  /** Color of the shape */
  color?: ColorValue;
  /**
   * Modifiers for the component.
   */
  modifiers?: ExpoModifier[];
};

type NativeShapeProps = Omit<ShapeProps, 'modifiers'> & {
  type: ShapeType;
  modifiers?: unknown;
};

export type ShapeRecordProps = Pick<
  NativeShapeProps,
  'cornerRounding' | 'smoothing' | 'verticesCount' | 'innerRadius' | 'radius' | 'type'
>;

const ShapeNativeView: React.ComponentType<NativeShapeProps> = requireNativeView(
  'ExpoUI',
  'ShapeView'
);

export type ShapeJSXElement = React.ReactElement<NativeShapeProps> & {
  __expo_shape_jsx_element_marker: true;
};

function Star(props: ShapeProps) {
  return (
    <ShapeNativeView {...props} modifiers={props?.modifiers} type="star" />
  ) as ShapeJSXElement;
}

function PillStar(props: ShapeProps) {
  return (
    <ShapeNativeView {...props} modifiers={props?.modifiers} type="pillStar" />
  ) as ShapeJSXElement;
}

function Pill(props: Pick<ShapeProps, 'smoothing' | 'color' | 'modifiers'>) {
  return (
    <ShapeNativeView {...props} modifiers={props?.modifiers} type="pill" />
  ) as ShapeJSXElement;
}

function Circle(props: Pick<ShapeProps, 'radius' | 'verticesCount' | 'color' | 'modifiers'>) {
  return (
    <ShapeNativeView {...props} modifiers={props?.modifiers} type="circle" />
  ) as ShapeJSXElement;
}

function Rectangle(
  props: Pick<ShapeProps, 'smoothing' | 'cornerRounding' | 'color' | 'modifiers'>
) {
  return (
    <ShapeNativeView {...props} modifiers={props?.modifiers} type="rectangle" />
  ) as ShapeJSXElement;
}

function Polygon(
  props: Pick<ShapeProps, 'smoothing' | 'cornerRounding' | 'verticesCount' | 'color' | 'modifiers'>
) {
  return (
    <ShapeNativeView {...props} modifiers={props?.modifiers} type="polygon" />
  ) as ShapeJSXElement;
}

export const Shape = {
  Star,
  PillStar,
  Pill,
  Circle,
  Rectangle,
  Polygon,
};

export function parseJSXShape(shape: ShapeJSXElement): ShapeRecordProps;
export function parseJSXShape(shape?: ShapeJSXElement): ShapeRecordProps | undefined;
export function parseJSXShape(shape?: ShapeJSXElement): ShapeRecordProps | undefined {
  if (!shape) return undefined;
  const { cornerRounding, smoothing, verticesCount, innerRadius, radius, type } = shape.props;
  return { cornerRounding, smoothing, verticesCount, innerRadius, radius, type };
}
