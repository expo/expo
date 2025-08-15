import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
// We have to work around the `role` and `onPress` props being reserved by React Native.
const ButtonNativeView = requireNativeView('ExpoUI', 'Button');
/**
 * exposed for ContextMenu
 * @hidden
 */
export function transformButtonProps(props, text) {
    const { role, onPress, systemImage, modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        text,
        systemImage,
        buttonRole: role,
        onButtonPressed: onPress,
    };
}
/**
 * Displays a native button component.
 */
export function Button(props) {
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
//# sourceMappingURL=index.js.map