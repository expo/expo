"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAllowedChildrenElements = filterAllowedChildrenElements;
exports.isChildOfType = isChildOfType;
const react_1 = __importDefault(require("react"));
function filterAllowedChildrenElements(children, components) {
    return react_1.default.Children.toArray(children).filter((child) => react_1.default.isValidElement(child) && components.includes(child.type));
}
function isChildOfType(child, type) {
    return react_1.default.isValidElement(child) && child.type === type;
}
//# sourceMappingURL=children.js.map