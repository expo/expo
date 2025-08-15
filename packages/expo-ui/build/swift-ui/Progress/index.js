import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const NativeProgressView = requireNativeView('ExpoUI', 'ProgressView');
/**
 * Renders a `CircularProgress` component.
 */
export function CircularProgress(props) {
    const { modifiers, ...restProps } = props;
    return (<NativeProgressView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...restProps} variant="circular"/>);
}
/**
 * Renders a `LinearProgress` component.
 */
export function LinearProgress(props) {
    const { modifiers, ...restProps } = props;
    return (<NativeProgressView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...restProps} variant="linear"/>);
}
//# sourceMappingURL=index.js.map