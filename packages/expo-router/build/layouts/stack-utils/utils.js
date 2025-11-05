"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isChildOfType = isChildOfType;
const react_1 = require("react");
function isChildOfType(element, type) {
    return (0, react_1.isValidElement)(element) && element.type === type;
}
//# sourceMappingURL=utils.js.map