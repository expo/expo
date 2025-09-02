import { requireNativeView } from 'expo';
import { MissingHostErrorView, isMissingHost } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const ChartNativeView = requireNativeView('ExpoUI', 'ChartView');
/**
 * Renders a native Chart component using Swift Charts.
 * @platform ios
 */
export function Chart({ style, data, modifiers, ...props }) {
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="Chart"/>;
    }
    return (<ChartNativeView data={data} modifiers={modifiers} {...(modifiers ? createViewModifierEventListener(modifiers) : undefined)} {...props}/>);
}
//# sourceMappingURL=index.js.map