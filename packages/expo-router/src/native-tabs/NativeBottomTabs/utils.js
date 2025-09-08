import React from 'react';
export function filterAllowedChildrenElements(children, components) {
    return React.Children.toArray(children).filter((child) => React.isValidElement(child) && components.includes(child.type));
}
export function isChildOfType(child, type) {
    return React.isValidElement(child) && child.type === type;
}
export function shouldTabBeVisible(options) {
    // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
    // If it is not defined, then it was not specified, and we should hide the tab.
    return options.hidden === false;
}
//# sourceMappingURL=utils.js.map