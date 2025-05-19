import { requireNativeView } from 'expo';
const ShapeNativeView = requireNativeView('ExpoUI', 'ShapeView');
function Star(props) {
    return <ShapeNativeView {...props} style={props.style} type="STAR"/>;
}
function PillStar(props) {
    return <ShapeNativeView {...props} style={props.style} type="PILL_STAR"/>;
}
function Pill(props) {
    return <ShapeNativeView {...props} style={props.style} type="PILL"/>;
}
function Circle(props) {
    return <ShapeNativeView {...props} style={props.style} type="CIRCLE"/>;
}
function Rectangle(props) {
    return <ShapeNativeView {...props} style={props.style} type="RECTANGLE"/>;
}
function Polygon(props) {
    return <ShapeNativeView {...props} style={props.style} type="POLYGON"/>;
}
export const Shape = {
    Star,
    PillStar,
    Pill,
    Circle,
    Rectangle,
    Polygon,
};
//# sourceMappingURL=index.js.map