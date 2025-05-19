import { requireNativeView } from 'expo';
import { StyleSheet } from 'react-native';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const ShapeNativeView = requireNativeView('ExpoUI', 'ShapeView');
/**
 * @hidden
 */
export function transformShapeProps(props) {
    const { ...restProps } = props;
    return {
        ...restProps,
    };
}
/**
 * Displays a native shape component.
 */
export function Shape(props) {
    return (<ShapeNativeView {...transformShapeProps(props)} style={StyleSheet.compose({ minWidth: 80, minHeight: 40 }, props.style)}/>);
}
//# sourceMappingURL=index.js.map