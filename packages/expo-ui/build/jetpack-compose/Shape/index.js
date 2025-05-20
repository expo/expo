import { requireNativeView } from 'expo';
const ShapeNativeView = requireNativeView('ExpoUI', 'ShapeView');
function Star(props) {
    return <ShapeNativeView {...props} style={props.style} type="star"/>;
}
function PillStar(props) {
    return <ShapeNativeView {...props} style={props.style} type="pillStar"/>;
}
function Pill(props) {
    return <ShapeNativeView {...props} style={props.style} type="pill"/>;
}
function Circle(props) {
    return <ShapeNativeView {...props} style={props.style} type="circle"/>;
}
function Rectangle(props) {
    return <ShapeNativeView {...props} style={props.style} type="rectangle"/>;
}
function Polygon(props) {
    return <ShapeNativeView {...props} style={props.style} type="polygon"/>;
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