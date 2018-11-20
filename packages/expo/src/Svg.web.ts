import { createElement } from 'react';

function generate(componentName, tagName) {
  function SvgElement(props) {
    return createElement(tagName, props, props.children);
  }
  SvgElement.displayName = componentName;
  return SvgElement;
}

export const Circle = generate('Circle', 'circle');
export const ClipPath = generate('ClipPath', 'clipPath');
export const Defs = generate('Defs', 'defs');
export const Ellipse = generate('Ellipse', 'ellipse');
export const G = generate('G', 'g');
export const Image = generate('Image', 'image');
export const Line = generate('Line', 'line');
export const LinearGradient = generate('LinearGradient', 'linearGradient');
export const Path = generate('Path', 'path');
export const Polygon = generate('Polygon', 'polygon');
export const Polyline = generate('Polyline', 'polyline');
export const RadialGradient = generate('RadialGradient', 'radialGradient');
export const Rect = generate('Rect', 'rect');
export const Stop = generate('Stop', 'stop');
export const Svg = generate('Svg', 'svg');
export const Symbol = generate('Symbol', 'symbol');
export const Text = generate('Text', 'text');
export const TextPath = generate('TextPath', 'textPath');
export const TSpan = generate('TSpan', 'tspan');
export const Use = generate('Use', 'use');

export default {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Image,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Polyline,
  RadialGradient,
  Rect,
  Stop,
  Svg,
  Symbol,
  Text,
  TextPath,
  TSpan,
  Use,
};
