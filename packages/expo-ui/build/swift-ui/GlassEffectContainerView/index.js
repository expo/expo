import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const GlassEffectContainerNativeView = requireNativeView('ExpoUI', 'GlassEffectContainerView');
function transformGroupProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
    };
}
export function GlassEffectContainer(props) {
    return <GlassEffectContainerNativeView {...transformGroupProps(props)}/>;
}
//# sourceMappingURL=index.js.map