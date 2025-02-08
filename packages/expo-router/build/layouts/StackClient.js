'use client';
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Stack = void 0;
const withLayoutContext_1 = require("./withLayoutContext");
const createNativeStackNavigator_1 = require("../fork/native-stack/createNativeStackNavigator");
const NativeStackNavigator = (0, createNativeStackNavigator_1.createNativeStackNavigator)().Navigator;
exports.Stack = (0, withLayoutContext_1.withLayoutContext)(NativeStackNavigator);
exports.default = exports.Stack;
//# sourceMappingURL=StackClient.js.map