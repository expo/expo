"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const native_stack_1 = require("@react-navigation/native-stack");
const withLayoutContext_1 = require("./withLayoutContext");
const NativeStackNavigator = (0, native_stack_1.createNativeStackNavigator)().Navigator;
exports.Stack = (0, withLayoutContext_1.withLayoutContext)(NativeStackNavigator);
exports.default = exports.Stack;
//# sourceMappingURL=Stack.js.map