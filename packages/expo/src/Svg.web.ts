// https://github.com/react-native-community/react-native-svg

import { StyleSheet, createElement } from 'react-native';
import React from 'react';

function resolve(styleProp, cleanedProps) {
  if (styleProp) {
    return StyleSheet
      ? [styleProp, cleanedProps]
      : styleProp[(global.Symbol as any).iterator]
      ? Object.assign({}, ...styleProp, cleanedProps)
      : Object.assign({}, styleProp, cleanedProps);
  } else {
    return cleanedProps;
  }
}

function prepare(props) {
  const {
    translate,
    scale,
    rotation,
    skewX,
    skewY,
    originX,
    originY,
    fontFamily,
    fontSize,
    fontWeight,
    fontStyle,
    style,
    ...clean
  } = props;

  const transform: string[] = [];

  if (originX != null || originY != null) {
    transform.push(`translate(${originX || 0}, ${originY || 0})`);
  }
  if (translate != null) {
    transform.push(`translate(${translate})`);
  }
  if (scale != null) {
    transform.push(`scale(${scale})`);
  }
  // rotation maps to rotate, not to collide with the text rotate attribute (which acts per glyph rather than block)
  if (rotation != null) {
    transform.push(`rotate(${rotation})`);
  }
  if (skewX != null) {
    transform.push(`skewX(${skewX})`);
  }
  if (skewY != null) {
    transform.push(`skewY(${skewY})`);
  }
  if (originX != null || originY != null) {
    transform.push(`translate(${-originX || 0}, ${-originY || 0})`);
  }

  if (transform.length) {
    clean.transform = transform.join(' ');
  }

  const styles: any = {};

  if (fontFamily != null) {
    styles.fontFamily = fontFamily;
  }
  if (fontSize != null) {
    styles.fontSize = fontSize;
  }
  if (fontWeight != null) {
    styles.fontWeight = fontWeight;
  }
  if (fontStyle != null) {
    styles.fontStyle = fontStyle;
  }

  clean.style = resolve(style, styles);

  return clean;
}

export class Svg extends React.Component {
  static Circle = props => createElement('circle', prepare(props));
  static ClipPath = props => createElement('clipPath', prepare(props));
  static Defs = props => createElement('defs', prepare(props));
  static Ellipse = props => createElement('ellipse', prepare(props));
  static Image = props => createElement('image', prepare(props));
  static Line = props => createElement('line', prepare(props));
  static LinearGradient = props => createElement('linearGradient', prepare(props));
  static Path = props => createElement('path', prepare(props));
  static Polygon = props => createElement('polygon', prepare(props));
  static Polyline = props => createElement('polyline', prepare(props));
  static RadialGradient = props => createElement('radialGradient', prepare(props));
  static Rect = props => createElement('rect', prepare(props));
  static Stop = props => createElement('stop', prepare(props));
  static Symbol = props => createElement('symbol', prepare(props));
  static Text = props => createElement('text', prepare(props));
  static TextPath = props => createElement('textPath', prepare(props));
  static TSpan = props => createElement('tspan', prepare(props));
  static Use = props => createElement('use', prepare(props));
  static Pattern = props => createElement('pattern', prepare(props));
  static Mask = props => createElement('mask', prepare(props));
  static G = props => {
    const { x, y, ...rest } = props;

    if ((x || y) && !rest.translate) {
      rest.translate = `${x || 0}, ${y || 0}`;
    }

    return createElement('g', prepare(rest));
  };

  render() {
    return createElement('svg', prepare(this.props));
  }
}

export const Circle = Svg.Circle;
export const ClipPath = Svg.ClipPath;
export const Defs = Svg.Defs;
export const Ellipse = Svg.Ellipse;
export const G = Svg.G;
export const Image = Svg.Image;
export const Line = Svg.Line;
export const LinearGradient = Svg.LinearGradient;
export const Mask = Svg.Mask;
export const Path = Svg.Path;
export const Pattern = Svg.Pattern;
export const Polygon = Svg.Polygon;
export const Polyline = Svg.Polyline;
export const RadialGradient = Svg.RadialGradient;
export const Rect = Svg.Rect;
export const Stop = Svg.Stop;
export const Symbol = Svg.Symbol;
export const Text = Svg.Text;
export const TextPath = Svg.TextPath;
export const TSpan = Svg.TSpan;
export const Use = Svg.Use;

export default Svg;
