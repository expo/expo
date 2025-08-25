import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const GlassEffectContainerNativeView = requireNativeView('ExpoUI', 'GlassEffectContainerView');
export function GlassEffectContainer(props) {
    const eventProp = props.modifiers ? createViewModifierEventListener(props.modifiers) : undefined;
    return <GlassEffectContainerNativeView {...props} {...eventProp}/>;
}
//# sourceMappingURL=index.js.map