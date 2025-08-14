import { requireNativeView } from 'expo';
import { Children, useMemo } from 'react';
import { transformChildrenToElementArray } from './utils';
const MenuNativeView = requireNativeView('ExpoUI', 'ContextMenu');
export function Submenu() {
    return <></>;
}
export function Items() {
    return <></>;
}
Items.tag = 'Items';
export function Trigger(props) {
    return <></>;
}
Trigger.tag = 'Trigger';
export function Preview(props) {
    return <></>;
}
function ContextMenu(props) {
    const eventHandlersMap = {};
    const initialChildren = Children.map(props.children, (c) => c.type.tag === Items.tag ? c.props.children : null);
    const processedElements = useMemo(() => transformChildrenToElementArray(initialChildren, eventHandlersMap), [initialChildren]);
    const activationElement = Children.map(props.children, (c) => c.type.tag === Trigger.tag ? c.props.children : null);
    const createEventHandler = (handlerType) => (e) => {
        const handler = eventHandlersMap[e.nativeEvent.contextMenuElementID]?.[handlerType];
        handler?.(e);
    };
    return (<MenuNativeView style={props.style} elements={processedElements} onContextMenuButtonPressed={createEventHandler('onPress')} onContextMenuSwitchValueChanged={createEventHandler('onValueChange')} onContextMenuPickerOptionSelected={createEventHandler('onOptionSelected')} 
    // @ts-expect-error
    modifiers={props.modifiers?.map((m) => m.__expo_shared_object_id__)} {...props}>
      {activationElement}
    </MenuNativeView>);
}
ContextMenu.Trigger = Trigger;
ContextMenu.Preview = Preview;
ContextMenu.Items = Items;
export { ContextMenu };
//# sourceMappingURL=index.js.map