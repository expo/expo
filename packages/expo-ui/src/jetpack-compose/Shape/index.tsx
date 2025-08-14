import { requireNativeView } from 'expo';
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

const ShapeNativeView: React.ComponentType<any> = requireNativeView('ExpoUI', 'ShapeView');

function Star(props: ShapeProps) {
  return <ShapeNativeView {...props} style={props.style} type="star" />;
}

function PillStar(props: ShapeProps) {
  return <ShapeNativeView {...props} style={props.style} type="pillStar" />;
}

function Pill(props: Pick<ShapeProps, 'smoothing' | 'style' | 'color'>) {
  return <ShapeNativeView {...props} style={props.style} type="pill" />;
}

function Circle(props: Pick<ShapeProps, 'radius' | 'verticesCount' | 'style' | 'color'>) {
  return <ShapeNativeView {...props} style={props.style} type="circle" />;
}

function Rectangle(props: Pick<ShapeProps, 'smoothing' | 'cornerRounding' | 'style' | 'color'>) {
  return <ShapeNativeView {...props} style={props.style} type="rectangle" />;
}

function Polygon(
  props: Pick<
    ShapeProps,
    'smoothing' | 'cornerRounding' | 'verticesCount' | 'style' | 'color' | 'modifiers'
  >
) {
  return (
    <ShapeNativeView
      {...props}
      // @ts-expect-error
      modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)}
      style={props.style}
      type="polygon"
    />
  );
}

export const Shape = {
  Star,
  PillStar,
  Pill,
  Circle,
  Rectangle,
  Polygon,
};
