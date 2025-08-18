import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const FormNativeView = requireNativeView('ExpoUI', 'FormView');
function transformFormProps(props) {
    const { modifiers, ...restProps } = props;
    return {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...restProps,
    };
}
export function Form(props) {
    return <FormNativeView {...transformFormProps(props)}/>;
}
//# sourceMappingURL=index.js.map