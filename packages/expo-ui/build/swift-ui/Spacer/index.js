import { requireNativeView } from 'expo';
import { isMissingHost, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const SpacerNativeView = requireNativeView('ExpoUI', 'SpacerView');
function transformSpacerProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
    };
}
export function Spacer(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Spacer"/>;
    }
    return <SpacerNativeView {...transformSpacerProps(props)}/>;
}
//# sourceMappingURL=index.js.map