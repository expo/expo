import { requireNativeView } from 'expo';
import { MissingHostErrorView, isMissingHost } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const GaugeNativeView = requireNativeView('ExpoUI', 'GaugeView');
/**
 * Renders a native `Gauge` component.
 * @platform ios
 */
export function Gauge({ type = 'default', modifiers, ...props }) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Gauge"/>;
    }
    return (<GaugeNativeView modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} type={type} {...props}/>);
}
//# sourceMappingURL=index.js.map