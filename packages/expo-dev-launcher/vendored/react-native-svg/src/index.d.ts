import * as React from 'react';
import * as ReactNative from 'react-native';
import { GestureResponderEvent, TransformsStyle } from 'react-native';

// Common props
export type NumberProp = string | number;
export type NumberArray = NumberProp[] | NumberProp;

export type FillRule = 'evenodd' | 'nonzero';
export type Units = 'userSpaceOnUse' | 'objectBoundingBox';

export type TextAnchor = 'start' | 'middle' | 'end';
export type FontStyle = 'normal' | 'italic' | 'oblique';
export type FontVariant = 'normal' | 'small-caps';
export type FontWeight =
  | NumberProp
  | 'normal'
  | 'bold'
  | 'bolder'
  | 'lighter'
  | '100'
  | '200'
  | '300'
  | '400'
  | '500'
  | '600'
  | '700'
  | '800'
  | '900';
export type FontStretch =
  | 'normal'
  | 'wider'
  | 'narrower'
  | 'ultra-condensed'
  | 'extra-condensed'
  | 'condensed'
  | 'semi-condensed'
  | 'semi-expanded'
  | 'expanded'
  | 'extra-expanded'
  | 'ultra-expanded';
export type TextDecoration =
  | 'none'
  | 'underline'
  | 'overline'
  | 'line-through'
  | 'blink';
export type FontVariantLigatures = 'normal' | 'none';
export type AlignmentBaseline =
  | 'baseline'
  | 'text-bottom'
  | 'alphabetic'
  | 'ideographic'
  | 'middle'
  | 'central'
  | 'mathematical'
  | 'text-top'
  | 'bottom'
  | 'center'
  | 'top'
  | 'text-before-edge'
  | 'text-after-edge'
  | 'before-edge'
  | 'after-edge'
  | 'hanging';
export type BaselineShift =
  | 'sub'
  | 'super'
  | 'baseline'
  | ReadonlyArray<NumberProp>
  | NumberProp;
export type LengthAdjust = 'spacing' | 'spacingAndGlyphs';

export type TextPathMethod = 'align' | 'stretch';
export type TextPathSpacing = 'auto' | 'exact';
export type TextPathMidLine = 'sharp' | 'smooth';

export type Linecap = 'butt' | 'square' | 'round';
export type Linejoin = 'miter' | 'bevel' | 'round';

export interface TouchableProps {
  disabled?: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  onPressIn?: (event: GestureResponderEvent) => void;
  onPressOut?: (event: GestureResponderEvent) => void;
  onLongPress?: (event: GestureResponderEvent) => void;
  delayPressIn?: number;
  delayPressOut?: number;
  delayLongPress?: number;
}

export interface ResponderProps extends ReactNative.GestureResponderHandlers {
  pointerEvents?: 'box-none' | 'none' | 'box-only' | 'auto';
}

// rgba values inside range 0 to 1 inclusive
// rgbaArray = [r, g, b, a]
export type rgbaArray = ReadonlyArray<number>;

// argb values inside range 0x00 to 0xff inclusive
// int32ARGBColor = 0xaarrggbb
export type int32ARGBColor = number;

export type Color = int32ARGBColor | rgbaArray | string;

export interface FillProps {
  fill?: Color;
  fillOpacity?: NumberProp;
  fillRule?: FillRule;
}

export interface ClipProps {
  clipRule?: FillRule;
  clipPath?: string;
}

export interface VectorEffectProps {
  vectorEffect?:
    | 'none'
    | 'non-scaling-stroke'
    | 'nonScalingStroke'
    | 'default'
    | 'inherit'
    | 'uri';
}

export interface DefinitionProps {
  id?: string;
}

export interface StrokeProps {
  stroke?: Color;
  strokeWidth?: NumberProp;
  strokeOpacity?: NumberProp;
  strokeDasharray?: ReadonlyArray<NumberProp> | NumberProp;
  strokeDashoffset?: NumberProp;
  strokeLinecap?: Linecap;
  strokeLinejoin?: Linejoin;
  strokeMiterlimit?: NumberProp;
}

export interface FontObject {
  fontStyle?: FontStyle;
  fontVariant?: FontVariant;
  fontWeight?: FontWeight;
  fontStretch?: FontStretch;
  fontSize?: NumberProp;
  fontFamily?: string;
  textAnchor?: TextAnchor;
  textDecoration?: TextDecoration;
  letterSpacing?: NumberProp;
  wordSpacing?: NumberProp;
  kerning?: NumberProp;
  fontFeatureSettings?: string;
  fontVariantLigatures?: FontVariantLigatures;
  fontVariationSettings?: string;
}

export interface FontProps extends FontObject {
  font?: FontObject;
}

export interface TransformObject {
  translate?: NumberArray;
  translateX?: NumberProp;
  translateY?: NumberProp;
  origin?: NumberArray;
  originX?: NumberProp;
  originY?: NumberProp;
  scale?: NumberArray;
  scaleX?: NumberProp;
  scaleY?: NumberProp;
  skew?: NumberArray;
  skewX?: NumberProp;
  skewY?: NumberProp;
  rotation?: NumberProp;
  x?: NumberArray;
  y?: NumberArray;
}

/*

  ColumnMajorTransformMatrix

  [a, b, c, d, tx, ty]

  This matrix can be visualized as:

  ╔═      ═╗
  ║ a c tx ║
  ║ b d ty ║
  ║ 0 0 1  ║
  ╚═      ═╝

*/
export type ColumnMajorTransformMatrix = [
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface TransformProps extends TransformObject {
  transform?:
    | ColumnMajorTransformMatrix
    | string
    | TransformObject
    | TransformsStyle['transform'];
}

export interface CommonMaskProps {
  mask?: string;
}

export interface CommonMarkerProps {
  marker?: string;
  markerStart?: string;
  markerMid?: string;
  markerEnd?: string;
}

export interface CommonPathProps
  extends FillProps,
    StrokeProps,
    ClipProps,
    TransformProps,
    VectorEffectProps,
    ResponderProps,
    TouchableProps,
    DefinitionProps,
    CommonMarkerProps,
    CommonMaskProps {}

// Element props
export interface CircleProps extends CommonPathProps {
  cx?: NumberProp;
  cy?: NumberProp;
  opacity?: NumberProp;
  r?: NumberProp;
}
export const Circle: React.ComponentClass<CircleProps>;
export type Circle = React.ComponentClass<CircleProps>;

export interface ClipPathProps {
  id?: string;
}
export const ClipPath: React.ComponentClass<ClipPathProps>;
export type ClipPath = React.ComponentClass<ClipPathProps>;

export const Defs: React.ComponentClass<{}>;
export type Defs = React.ComponentClass<{}>;

export interface EllipseProps extends CommonPathProps {
  cx?: NumberProp;
  cy?: NumberProp;
  opacity?: NumberProp;
  rx?: NumberProp;
  ry?: NumberProp;
}
export const Ellipse: React.ComponentClass<EllipseProps>;
export type Ellipse = React.ComponentClass<EllipseProps>;

export interface GProps extends CommonPathProps {
  opacity?: NumberProp;
}
export const G: React.ComponentClass<GProps>;
export type G = React.ComponentClass<GProps>;

export interface ForeignObjectProps {
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
}
export const ForeignObject: React.ComponentClass<ForeignObjectProps>;
export type ForeignObject = React.ComponentClass<ForeignObjectProps>;

export interface ImageProps
  extends ResponderProps,
    CommonMaskProps,
    ClipProps,
    TouchableProps {
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
  xlinkHref?: ReactNative.ImageProps['source'];
  href?: ReactNative.ImageProps['source'];
  preserveAspectRatio?: string;
  opacity?: NumberProp;
  clipPath?: string;
  id?: string;
}
export const Image: React.ComponentClass<ImageProps>;
export type Image = React.ComponentClass<ImageProps>;

export interface LineProps extends CommonPathProps {
  opacity?: NumberProp;
  x1?: NumberProp;
  x2?: NumberProp;
  y1?: NumberProp;
  y2?: NumberProp;
}
export const Line: React.ComponentClass<LineProps>;
export type Line = React.ComponentClass<LineProps>;

export interface LinearGradientProps {
  x1?: NumberProp;
  x2?: NumberProp;
  y1?: NumberProp;
  y2?: NumberProp;
  gradientUnits?: Units;
  gradientTransform?: ColumnMajorTransformMatrix | string;
  id?: string;
}
export const LinearGradient: React.ComponentClass<LinearGradientProps>;
export type LinearGradient = React.ComponentClass<LinearGradientProps>;

export interface PathProps extends CommonPathProps {
  d?: string;
  opacity?: NumberProp;
}
export const Path: React.ComponentClass<PathProps>;
export type Path = React.ComponentClass<PathProps>;

export interface PatternProps {
  id?: string;
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
  patternTransform?: ColumnMajorTransformMatrix | string;
  patternUnits?: Units;
  patternContentUnits?: Units;
  viewBox?: string;
  preserveAspectRatio?: string;
}
export const Pattern: React.ComponentClass<PatternProps>;
export type Pattern = React.ComponentClass<PatternProps>;

export interface PolygonProps extends CommonPathProps {
  opacity?: NumberProp;
  points?: string | ReadonlyArray<NumberProp>;
}
export const Polygon: React.ComponentClass<PolygonProps>;
export type Polygon = React.ComponentClass<PolygonProps>;

export interface PolylineProps extends CommonPathProps {
  opacity?: NumberProp;
  points?: string | ReadonlyArray<NumberProp>;
}
export const Polyline: React.ComponentClass<PolylineProps>;
export type Polyline = React.ComponentClass<PolylineProps>;

export interface RadialGradientProps {
  fx?: NumberProp;
  fy?: NumberProp;
  rx?: NumberProp;
  ry?: NumberProp;
  cx?: NumberProp;
  cy?: NumberProp;
  r?: NumberProp;
  gradientUnits?: Units;
  gradientTransform?: ColumnMajorTransformMatrix | string;
  id?: string;
}
export const RadialGradient: React.ComponentClass<RadialGradientProps>;
export type RadialGradient = React.ComponentClass<RadialGradientProps>;

export interface RectProps extends CommonPathProps {
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
  rx?: NumberProp;
  ry?: NumberProp;
  opacity?: NumberProp;
}
export const Rect: React.ComponentClass<RectProps>;
export type Rect = React.ComponentClass<RectProps>;

export interface StopProps {
  stopColor?: Color;
  stopOpacity?: NumberProp;
  offset?: NumberProp;
}
export const Stop: React.ComponentClass<StopProps>;
export type Stop = React.ComponentClass<StopProps>;

export interface SvgProps extends GProps, ReactNative.ViewProperties {
  width?: NumberProp;
  height?: NumberProp;
  viewBox?: string;
  preserveAspectRatio?: string;
  color?: Color;
  title?: string;
}

// Svg is both regular and default exported
export const Svg: React.ComponentClass<SvgProps>;
export type Svg = React.ComponentClass<SvgProps>;
export default Svg;

export interface SymbolProps {
  id?: string;
  viewBox?: string;
  preserveAspectRatio?: string;
  opacity?: NumberProp;
}
export const Symbol: React.ComponentClass<SymbolProps>;
export type Symbol = React.ComponentClass<SymbolProps>;

export interface TSpanProps extends CommonPathProps, FontProps {
  x?: NumberArray;
  y?: NumberArray;
  dx?: NumberArray;
  dy?: NumberArray;
  rotate?: NumberArray;
  inlineSize?: NumberProp;
}
export const TSpan: React.ComponentClass<TSpanProps>;
export type TSpan = React.ComponentClass<TSpanProps>;

export interface TextSpecificProps extends CommonPathProps, FontProps {
  alignmentBaseline?: AlignmentBaseline;
  baselineShift?: BaselineShift;
  verticalAlign?: NumberProp;
  lengthAdjust?: LengthAdjust;
  textLength?: NumberProp;
  fontData?: null | { [name: string]: unknown };
  fontFeatureSettings?: string;
}

export interface TextProps extends TextSpecificProps {
  x?: NumberArray;
  y?: NumberArray;
  dx?: NumberArray;
  dy?: NumberArray;
  rotate?: NumberArray;
  opacity?: NumberProp;
  inlineSize?: NumberProp;
}
export const Text: React.ComponentClass<TextProps>;
export type Text = React.ComponentClass<TextProps>;

export interface TextPathProps extends TextSpecificProps {
  xlinkHref?: string;
  href?: string;
  startOffset?: NumberProp;
  method?: TextPathMethod;
  spacing?: TextPathSpacing;
  midLine?: TextPathMidLine;
}
export const TextPath: React.ComponentClass<TextPathProps>;
export type TextPath = React.ComponentClass<TextPathProps>;

export interface UseProps extends CommonPathProps {
  xlinkHref?: string;
  href?: string;
  width?: NumberProp;
  height?: NumberProp;
  x?: NumberProp;
  y?: NumberProp;
  opacity?: NumberProp;
}
export const Use: React.ComponentClass<UseProps>;
export type Use = React.ComponentClass<UseProps>;

export enum EMaskUnits {
  USER_SPACE_ON_USE = 'userSpaceOnUse',
  OBJECT_BOUNDING_BOX = 'objectBoundingBox',
}

export type TMaskUnits =
  | EMaskUnits.USER_SPACE_ON_USE
  | EMaskUnits.OBJECT_BOUNDING_BOX;

export interface MaskProps extends CommonPathProps {
  id?: string;
  x?: NumberProp;
  y?: NumberProp;
  width?: NumberProp;
  height?: NumberProp;
  maskTransform?: ColumnMajorTransformMatrix | string;
  maskUnits?: TMaskUnits;
  maskContentUnits?: TMaskUnits;
}
export const Mask: React.ComponentClass<MaskProps>;
export type Mask = React.ComponentClass<MaskProps>;

export enum MarkerUnits {
  STROKE_WIDTH = 'strokeWidth',
  USER_SPACE_ON_USE = 'userSpaceOnUse',
}

export enum Orient {
  AUTO = 'auto',
  AUTO_START_REVERSE = 'auto-start-reverse',
}

export interface MarkerProps {
  id?: string;
  viewBox?: string;
  preserveAspectRatio?: string;
  refX?: NumberProp;
  refY?: NumberProp;
  markerWidth?: NumberProp;
  markerHeight?: NumberProp;
  markerUnits?: MarkerUnits;
  orient?: Orient | NumberProp;
}
export const Marker: React.ComponentClass<MarkerProps>;
export type Marker = React.ComponentClass<MarkerProps>;

export type Styles = { [property: string]: string };

export interface AST {
  tag: string;
  style?: Styles;
  styles?: string;
  priority?: Map<string, boolean | undefined>;
  parent: AST | null;
  children: (AST | string)[] | (JSX.Element | string)[];
  props: {
    [prop: string]: Styles | string | undefined;
  };
  Tag: React.ComponentType;
}

export interface XmlAST extends AST {
  children: (XmlAST | string)[];
  parent: XmlAST | null;
}

export interface JsxAST extends AST {
  children: (JSX.Element | string)[];
}

export interface UriProps extends SvgProps {
  uri: string | null;
  override?: SvgProps;
}
export type UriState = { xml: string | null };

export interface XmlProps extends SvgProps {
  xml: string | null;
  override?: SvgProps;
}
export type XmlState = { ast: JsxAST | null };

export interface AstProps extends SvgProps {
  ast: JsxAST | null;
  override?: SvgProps;
}

export type Middleware = (ast: XmlAST) => XmlAST;

export function parse(source: string, middleware?: Middleware): JsxAST | null;

export const SvgAst: React.FunctionComponent<AstProps>;

export const SvgXml: React.FunctionComponent<XmlProps>;
export const SvgFromXml: React.ComponentClass<XmlProps, XmlState>;

export const SvgUri: React.FunctionComponent<UriProps>;
export const SvgFromUri: React.ComponentClass<UriProps, UriState>;

export const SvgCss: React.FunctionComponent<XmlProps>;
export const SvgWithCss: React.ComponentClass<XmlProps, XmlState>;

export const SvgCssUri: React.FunctionComponent<UriProps>;
export const SvgWithCssUri: React.ComponentClass<UriProps, UriState>;

export const inlineStyles: Middleware;
