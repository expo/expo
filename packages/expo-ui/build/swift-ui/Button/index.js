import { requireNativeView } from 'expo';
import { Host } from '../Host';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView = requireNativeView('ExpoUI', 'Button');
/**
 * @hidden
 */
export function transformButtonProps(props, text) {
    const { role, onPress, systemImage, ...restProps } = props;
    return {
        ...restProps,
        text,
        systemImage,
        buttonRole: role,
        onButtonPressed: onPress,
    };
}
/**
 * `<Button>` component without a host view.
 * You should use this with a `Host` component in ancestor.
 */
export function ButtonPrimitive(props) {
    const { children, ...restProps } = props;
    if (!children && !restProps.systemImage) {
        throw new Error('Button without systemImage prop should have React children');
    }
    const text = typeof children === 'string' ? children : undefined;
    const transformedProps = transformButtonProps(restProps, text);
    // Render without children wrapper if text-only or icon-only
    const shouldRenderDirectly = text != null || children == null;
    if (shouldRenderDirectly) {
        return <ButtonNativeView {...transformedProps}/>;
    }
    return <ButtonNativeView {...transformedProps}>{children}</ButtonNativeView>;
}
/**
 * Displays a native button component.
 */
export function Button(props) {
    const useViewportSizeMeasurement = props.style == null;
    return (<Host style={props.style} matchContents useViewportSizeMeasurement={useViewportSizeMeasurement}>
      <ButtonPrimitive {...props}/>
    </Host>);
}
//# sourceMappingURL=index.js.map