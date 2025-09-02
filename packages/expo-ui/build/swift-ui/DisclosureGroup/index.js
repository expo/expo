import { requireNativeView } from 'expo';
import { createViewModifierEventListener } from '../modifiers/utils';
const DisclosureGroupNativeView = requireNativeView('ExpoUI', 'DisclosureGroupView');
export function DisclosureGroup(props) {
    const { onStateChange, modifiers, ...rest } = props;
    function handleStateChange(event) {
        onStateChange?.(event.nativeEvent.isExpanded);
    }
    const transformedProps = {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        ...rest,
    };
    return <DisclosureGroupNativeView {...transformedProps} onStateChange={handleStateChange}/>;
}
//# sourceMappingURL=index.js.map