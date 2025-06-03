import { Children, isValidElement } from 'react';
import { Submenu } from './index';
import { Button, ButtonPrimitive, transformButtonProps, } from '../Button';
import { Picker, PickerPrimitive } from '../Picker';
import { Switch, SwitchPrimitive } from '../Switch';
// Maps the react children to NativeMenuElement[] which is used to render out the native menu
// TODO: Ideally we want to pass the children directly to the native side without having to do this
export function transformChildrenToElementArray(children, eventHandlersMap) {
    return Children.toArray(children)
        .map((child) => processChildElement(child, eventHandlersMap))
        .filter((el) => el !== null);
}
function processChildElement(child, eventHandlersMap) {
    if (!isValidElement(child))
        return null;
    const uuid = expo.uuidv4();
    if (child.type === Button || child.type === ButtonPrimitive) {
        // @ts-expect-error TODO TS2345: Argument of type unknown is not assignable to parameter of type SubmenuProps
        return createButtonElement(uuid, child.props, eventHandlersMap);
    }
    if (child.type === Switch || child.type === SwitchPrimitive) {
        // @ts-expect-error TODO TS2345: Argument of type unknown is not assignable to parameter of type SubmenuProps
        return createSwitchElement(uuid, child.props, eventHandlersMap);
    }
    if (child.type === Picker || child.type === PickerPrimitive) {
        // @ts-expect-error TODO TS2345: Argument of type unknown is not assignable to parameter of type SubmenuProps
        return createPickerElement(uuid, child.props, eventHandlersMap);
    }
    if (isSubmenuComponent(child)) {
        // @ts-expect-error TODO TS2345: Argument of type unknown is not assignable to parameter of type SubmenuProps
        return createSubmenuElement(uuid, child.props, eventHandlersMap);
    }
    console.warn('Unsupported child type in Menu: ', child.type);
    return null;
}
function createButtonElement(uuid, props, handlers) {
    if (props.onPress) {
        handlers[uuid] = { onPress: props.onPress };
    }
    if (typeof props.children !== 'string') {
        throw new Error('ContextMenu Button only supports string children');
    }
    return {
        contextMenuElementID: uuid,
        button: transformButtonProps(props, props.children),
    };
}
function createSwitchElement(uuid, props, handlers) {
    if (props.onValueChange) {
        handlers[uuid] = {
            onValueChange: ({ nativeEvent: { value } }) => {
                props.onValueChange?.(value);
            },
        };
    }
    return {
        contextMenuElementID: uuid,
        switch: props,
    };
}
function createPickerElement(uuid, props, handlers) {
    if (props.onOptionSelected) {
        handlers[uuid] = { onOptionSelected: props.onOptionSelected };
    }
    return {
        contextMenuElementID: uuid,
        picker: props,
    };
}
function createSubmenuElement(uuid, props, handlers) {
    if (typeof props.button.props.children !== 'string') {
        throw new Error('ContextMenu Submenu Button only supports string children');
    }
    return {
        contextMenuElementID: uuid,
        submenu: {
            button: transformButtonProps(props.button.props, props.button.props.children),
            elements: transformChildrenToElementArray(props.children, handlers),
        },
    };
}
function isSubmenuComponent(child) {
    return child.type.toString() === Submenu.toString();
}
//# sourceMappingURL=utils.js.map