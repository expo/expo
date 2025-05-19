"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Protected = void 0;
exports.isProtectedReactElement = isProtectedReactElement;
const react_1 = require("react");
const primitives_1 = require("../primitives");
exports.Protected = primitives_1.Group;
function isProtectedReactElement(child) {
    return Boolean((0, react_1.isValidElement)(child) && child.type === primitives_1.Group && child.props && 'guard' in child.props);
}
//# sourceMappingURL=Protected.js.map