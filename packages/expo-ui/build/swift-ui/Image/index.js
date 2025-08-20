import { requireNativeView } from 'expo';
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
    return <ImageNativeView {...transformNativeProps(props)}/>;
}
//# sourceMappingURL=index.js.map