import { Children, isValidElement } from 'react';
import { Submenu } from './index';
import { Button, transformButtonProps } from '../Button';
import { Picker } from '../Picker';
import { Switch } from '../Switch';
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
    if (child.type === Button) {
        // @ts-expect-error TODO TS2345: Argument of type unknown is not assignable to parameter of type SubmenuProps
        return createButtonElement(uuid, child.props, eventHandlersMap);
    }
    if (child.type === Switch) {
        // @ts-expect-error TODO TS2345: Argument of type unknown is not assignable to parameter of type SubmenuProps
        return createSwitchElement(uuid, child.props, eventHandlersMap);
    }
    if (child.type === Picker) {
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
    return {
        contextMenuElementID: uuid,
        button: transformButtonProps(props),
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
    return {
        contextMenuElementID: uuid,
        submenu: {
            button: transformButtonProps(props.button.props),
            elements: transformChildrenToElementArray(props.children, handlers),
        },
    };
}
function isSubmenuComponent(child) {
    return child.type.toString() === Submenu.toString();
}
//# sourceMappingURL=utils.js.map