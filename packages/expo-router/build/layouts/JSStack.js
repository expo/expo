"use strict";
'use client';
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const jsx_runtime_1 = require("react/jsx-runtime");
const withLayoutContext_1 = require("./withLayoutContext");
const stack_1 = require("../react-navigation/stack");
const Protected_1 = require("../views/Protected");
const Screen_1 = require("../views/Screen");
__exportStar(require("../react-navigation/stack"), exports);
const JSStackNavigator = (0, stack_1.createStackNavigator)().Navigator;
const JSStack = (0, withLayoutContext_1.withLayoutContext)(JSStackNavigator);
/**
 * Renders a JavaScript-based stack navigator.
 *
 * @hideType
 */
const Stack = Object.assign((props) => {
    return (0, jsx_runtime_1.jsx)(JSStack, { ...props });
}, {
    Screen: Screen_1.Screen,
    Protected: Protected_1.Protected,
});
exports.Stack = Stack;
exports.default = Stack;
//# sourceMappingURL=JSStack.js.map