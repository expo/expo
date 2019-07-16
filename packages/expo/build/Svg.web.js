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
export const Circle = Svg.Circle;
export const ClipPath = Svg.ClipPath;
export const Defs = Svg.Defs;
export const Ellipse = Svg.Ellipse;
export const G = Svg.G;
export const Image = Svg.Image;
export const Line = Svg.Line;
export const LinearGradient = Svg.LinearGradient;
export const Path = Svg.Path;
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
//# sourceMappingURL=Svg.web.js.map