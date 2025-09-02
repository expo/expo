import { requireNativeView } from 'expo';
import { isMissingHost, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const TextNativeView = requireNativeView('ExpoUI', 'TextView');
function transformTextProps(props) {
    const { children, modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
        text: children ?? '',
    };
}
export function Text(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Text"/>;
    }
    return <TextNativeView {...transformTextProps(props)}/>;
}
//# sourceMappingURL=index.js.map