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
    return (<ShapeNativeView {...props} 
    // @ts-expect-error
    modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)} style={props.style} type="polygon"/>);
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