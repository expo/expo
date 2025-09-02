import { requireNativeView } from 'expo';
import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const FormNativeView = requireNativeView('ExpoUI', 'FormView');
function transformFormProps(props) {
    const { modifiers, children, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        children: markChildrenAsNestedInSwiftUI(children),
        ...restProps,
    };
}
export function Form(props) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Form"/>;
    }
    return <FormNativeView {...transformFormProps(props)}/>;
}
//# sourceMappingURL=index.js.map