import { createElement } from 'react';

function generate(componentName, tagName) {
  function SvgElement(props) {
    return createElement(tagName, props, props.children);
  }
  SvgElement.displayName = componentName;
  return SvgElement;
}

const types = {
  Circle: 'circle',
  ClipPath: 'clipPath',
  Defs: 'defs',
  Ellipse: 'ellipse',
  G: 'g',
  Image: 'image',
  Line: 'line',
  LinearGradient: 'linearGradient',
  Path: 'path',
  Polygon: 'polygon',
  Polyline: 'polyline',
  RadialGradient: 'radialGradient',
  Rect: 'rect',
  Stop: 'stop',
  Symbol: 'symbol',
  Text: 'text',
  TextPath: 'textPath',
  TSpan: 'tspan',
  Use: 'use',
};

export const Svg = generate('Svg', 'svg');

for (const [componentName, tagName] of Object.entries(types)) {
  Svg[componentName] = generate(componentName, tagName);
}

export default Svg;
