import { requireNativeView } from 'expo';
import { MissingHostErrorView, isMissingHost } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
function transformNativeProps(props) {
    const { onPress, modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        ...(onPress ? { useTapGesture: true, onTap: () => onPress() } : null),
    };
}
const ImageNativeView = requireNativeView('ExpoUI', 'ImageView');
export function Image(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Image"/>;
    }
    return <ImageNativeView {...transformNativeProps(props)}/>;
}
//# sourceMappingURL=index.js.map