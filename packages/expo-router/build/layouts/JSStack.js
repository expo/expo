"use strict";
'use client';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const react_1 = __importDefault(require("react"));
const withLayoutContext_1 = require("./withLayoutContext");
const stack_1 = require("../react-navigation/stack");
const Protected_1 = require("../views/Protected");
const Screen_1 = require("../views/Screen");
const JSStackNavigator = (0, stack_1.createStackNavigator)().Navigator;
const JSStack = (0, withLayoutContext_1.withLayoutContext)(JSStackNavigator);
/**
 * Renders a JavaScript-based stack navigator.
 *
 * @hideType
 */
const Stack = Object.assign((props) => {
    return <JSStack {...props}/>;
}, {
    Screen: Screen_1.Screen,
    Protected: Protected_1.Protected,
});
exports.Stack = Stack;
exports.default = Stack;
//# sourceMappingURL=JSStack.js.map