import { requireNativeView } from 'expo';
import { MissingHostErrorView, isMissingHost } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const NativeProgressView = requireNativeView('ExpoUI', 'ProgressView');
/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props) {
    const { modifiers, ...restProps } = props;
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="CircularProgress"/>;
    }
    return (<NativeProgressView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...restProps} variant="circular"/>);
}
/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props) {
    const { modifiers, ...restProps } = props;
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="LinearProgress"/>;
    }
    return (<NativeProgressView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...restProps} variant="linear"/>);
}
//# sourceMappingURL=index.js.map