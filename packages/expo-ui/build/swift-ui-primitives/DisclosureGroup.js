import { requireNativeView } from 'expo';
const DisclosureGroupNativeView = requireNativeView('ExpoUI', 'DisclosureGroupView');
export function DisclosureGroup(props) {
    const { onStateChange, ...rest } = props;
    function handleStateChange(event) {
        onStateChange?.(event.nativeEvent.isExpanded);
    }
    return <DisclosureGroupNativeView {...rest} onStateChange={handleStateChange}/>;
}
//# sourceMappingURL=DisclosureGroup.js.map