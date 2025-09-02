import { requireNativeView } from 'expo';
import { isMissingHost, markChildrenAsNestedInSwiftUI, MissingHostErrorView } from '../Host';
import { createViewModifierEventListener } from '../modifiers/utils';
const DisclosureGroupNativeView = requireNativeView('ExpoUI', 'DisclosureGroupView');
export function DisclosureGroup(props) {
    const { onStateChange, modifiers, children, ...rest } = props;
    function handleStateChange(event) {
        onStateChange?.(event.nativeEvent.isExpanded);
    }
    const transformedProps = {
        modifiers,
        ...(modifiers ? createViewModifierEventListener(modifiers) : undefined),
        children: markChildrenAsNestedInSwiftUI(children),
        ...rest,
    };
    if (isMissingHost(props)) {
        return <MissingHostErrorView componentName="DisclosureGroup"/>;
    }
    return <DisclosureGroupNativeView {...transformedProps} onStateChange={handleStateChange}/>;
}
//# sourceMappingURL=index.js.map