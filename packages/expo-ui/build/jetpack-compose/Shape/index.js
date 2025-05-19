import { requireNativeView } from 'expo';
/**
 * @hidden
 */
const ShapeNativeView = requireNativeView('ExpoUI', 'ShapeView');
/**
 * Displays a native shape component.
 */
export function Shape(props) {
    return <ShapeNativeView {...props} style={props.style}/>;
}
//# sourceMappingURL=index.js.map