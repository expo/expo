"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.filterAllowedChildrenElements = filterAllowedChildrenElements;
exports.isChildOfType = isChildOfType;
exports.shouldTabBeVisible = shouldTabBeVisible;
exports.getValueFromTypeOrRecord = getValueFromTypeOrRecord;
const react_1 = __importDefault(require("react"));
function filterAllowedChildrenElements(children, components) {
    return react_1.default.Children.toArray(children).filter((child) => react_1.default.isValidElement(child) && components.includes(child.type));
}
function isChildOfType(child, type) {
    return react_1.default.isValidElement(child) && child.type === type;
}
function shouldTabBeVisible(options) {
    // The <NativeTab.Trigger> always sets `hidden` to defined boolean value.
    // If it is not defined, then it was not specified, and we should hide the tab.
    return options.hidden === false;
}
function getValueFromTypeOrRecord(value, key) {
    if (value && typeof value === 'object' && key in value) {
        return value[key];
    }
    return value;
}
//# sourceMappingURL=utils.js.map