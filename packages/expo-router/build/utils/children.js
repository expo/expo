"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildOfType = isChildOfType;
exports.getFirstChildOfType = getFirstChildOfType;
exports.getAllChildrenOfType = getAllChildrenOfType;
exports.getAllChildrenNotOfType = getAllChildrenNotOfType;
exports.filterAllowedChildrenElements = filterAllowedChildrenElements;
const react_1 = require("react");
function isChildOfType(element, type) {
    return (0, react_1.isValidElement)(element) && element.type === type;
}
function getFirstChildOfType(children, type) {
    return react_1.Children.toArray(children).find((child) => isChildOfType(child, type));
}
function getAllChildrenOfType(children, type) {
    return react_1.Children.toArray(children).filter((child) => isChildOfType(child, type));
}
function getAllChildrenNotOfType(children, type) {
    return react_1.Children.toArray(children).filter((child) => !isChildOfType(child, type));
}
function filterAllowedChildrenElements(children, components) {
    return react_1.Children.toArray(children).filter((child) => (0, react_1.isValidElement)(child) && components.includes(child.type));
}
//# sourceMappingURL=children.js.map