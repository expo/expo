import { requireNativeView } from 'expo';
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
    return <SpacerNativeView {...transformSpacerProps(props)}/>;
}
//# sourceMappingURL=index.js.map