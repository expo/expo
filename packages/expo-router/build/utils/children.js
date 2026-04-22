import { Children, isValidElement, } from 'react';
export function isChildOfType(element, type) {
    return isValidElement(element) && element.type === type;
}
export function getFirstChildOfType(children, type) {
    return Children.toArray(children).find((child) => isChildOfType(child, type));
}
export function getAllChildrenOfType(children, type) {
    return Children.toArray(children).filter((child) => isChildOfType(child, type));
}
export function getAllChildrenNotOfType(children, type) {
    return Children.toArray(children).filter((child) => !isChildOfType(child, type));
}
export function filterAllowedChildrenElements(children, components) {
    return Children.toArray(children).filter((child) => isValidElement(child) && components.includes(child.type));
}
//# sourceMappingURL=children.js.map